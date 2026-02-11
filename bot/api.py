from urllib.parse import urlparse

from aiohttp import web
from aiogram import Bot
from aiogram.types import LabeledPrice

from config import ALLOWED_PRICES, BOT_TOKEN, CORS_ALLOW_ORIGIN, INIT_DATA_MAX_AGE_SECONDS, MINI_APP_URL
from database import Database
from payments import INVOICE_API_ROUTE, build_invoice_payload, parse_invoice_request_payload
from security import extract_user_from_init_data, verify_telegram_init_data


async def handle_invoice(request: web.Request) -> web.Response:
    bot: Bot = request.app["bot"]
    db: Database = request.app["db"]

    init_data = request.headers.get("X-Telegram-Init-Data", "")
    parsed = verify_telegram_init_data(init_data, BOT_TOKEN, INIT_DATA_MAX_AGE_SECONDS)
    if not parsed:
        return web.json_response({"error": "invalid_init_data"}, status=401)

    user = extract_user_from_init_data(parsed)
    if not user:
        return web.json_response({"error": "invalid_user"}, status=400)

    await db.upsert_user(user)

    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "invalid_payload"}, status=400)

    payload = parse_invoice_request_payload(body)
    if not payload:
        return web.json_response({"error": "invalid_payload"}, status=400)

    if payload["amount"] not in ALLOWED_PRICES:
        return web.json_response({"error": "unsupported_amount"}, status=400)

    if payload["user_id"] != user["id"]:
        return web.json_response({"error": "user_id_mismatch"}, status=403)

    invoice_payload = build_invoice_payload(payload["amount"], payload["user_id"])
    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {payload['amount']} звезд.",
        payload=invoice_payload,
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=f"{payload['amount']} Stars", amount=payload['amount'])],
    )

    return web.json_response({"invoice_link": invoice_link})


async def handle_leaderboard(request: web.Request) -> web.Response:
    db: Database = request.app["db"]

    init_data = request.headers.get("X-Telegram-Init-Data")
    if init_data:
        parsed = verify_telegram_init_data(init_data, BOT_TOKEN, INIT_DATA_MAX_AGE_SECONDS)
        if parsed:
            user = extract_user_from_init_data(parsed)
            if user:
                await db.upsert_user(user)
        else:
            print("Invalid initData received")

    leaderboard = await db.get_leaderboard()
    return web.json_response(leaderboard)


def _resolve_allowed_origin() -> str | None:
    if CORS_ALLOW_ORIGIN:
        return CORS_ALLOW_ORIGIN

    parsed_origin = urlparse(MINI_APP_URL)
    if parsed_origin.scheme and parsed_origin.netloc:
        return f"{parsed_origin.scheme}://{parsed_origin.netloc}"

    return None


async def run_api_server(bot: Bot, db: Database, api_host: str, api_port: int) -> None:
    allowed_origin = _resolve_allowed_origin()

    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        if request.method == "OPTIONS":
            response = web.Response(status=204)
        else:
            response = await handler(request)

        request_origin = request.headers.get("Origin")
        if allowed_origin and request_origin == allowed_origin:
            response.headers["Access-Control-Allow-Origin"] = allowed_origin
            response.headers["Vary"] = "Origin"

        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Telegram-Init-Data"
        return response

    app = web.Application(middlewares=[cors_middleware])
    app["bot"] = bot
    app["db"] = db
    app.router.add_post(INVOICE_API_ROUTE, handle_invoice)
    app.router.add_options(INVOICE_API_ROUTE, handle_invoice)
    app.router.add_get("/api/leaderboard", handle_leaderboard)
    app.router.add_options("/api/leaderboard", handle_leaderboard)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, api_host, api_port)
    await site.start()
