import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

from aiohttp import web
from aiogram import Bot
from aiogram.types import LabeledPrice

from config import ALLOWED_PRICES, BOT_TOKEN, CORS_ALLOW_ORIGIN, INIT_DATA_MAX_AGE_SECONDS, MINI_APP_URL
from database import Database
from payments import build_invoice_payload
from security import extract_user_from_init_data, verify_telegram_init_data


logger = logging.getLogger(__name__)


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

    amount_raw = request.query.get("amount", "0")
    try:
        amount = int(amount_raw)
    except ValueError:
        return web.json_response({"error": "invalid_amount"}, status=400)

    if amount not in ALLOWED_PRICES:
        return web.json_response({"error": "unsupported_amount"}, status=400)

    payload = build_invoice_payload(amount, user["id"])
    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {amount} звезд.",
        payload=payload,
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=f"{amount} Stars", amount=amount)],
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


async def handle_create_invoice_legacy(request: web.Request) -> web.Response:
    logger.warning(
        "Deprecated endpoint hit: route=%s user_agent=%s timestamp=%s",
        request.path,
        request.headers.get("User-Agent", ""),
        datetime.now(timezone.utc).isoformat(),
    )
    return web.json_response(
        {
            "error": "deprecated_endpoint",
            "message": "Endpoint /create-invoice is deprecated. Use /api/invoice instead.",
        },
        status=410,
    )


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
    app.router.add_get("/api/invoice", handle_invoice)
    app.router.add_options("/api/invoice", handle_invoice)
    app.router.add_post("/create-invoice", handle_create_invoice_legacy)
    app.router.add_get("/api/leaderboard", handle_leaderboard)
    app.router.add_options("/api/leaderboard", handle_leaderboard)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, api_host, api_port)
    await site.start()
