import asyncio
import hashlib
import hmac
import json
import os
from urllib.parse import parse_qsl

from aiohttp import web
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import LabeledPrice
from aiogram.utils.keyboard import InlineKeyboardBuilder
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEB_APP_URL = os.getenv("WEB_APP_URL") or os.getenv("APP_PUBLIC_URL")

# MINI_APP_URL можно задать напрямую или оставить пустым, чтобы использовать WEB_APP_URL
MINI_APP_URL = os.getenv("MINI_APP_URL") or WEB_APP_URL
MINI_APP_BUTTON = os.getenv("MINI_APP_BUTTON", "Открыть мини-приложение")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8080"))
ALLOWED_PRICES = {25, 50, 100}

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is not set. Add it to .env or the environment before starting the bot.")

if not MINI_APP_URL:
    raise RuntimeError(
        "WEB_APP_URL is not set. Add WEB_APP_URL or MINI_APP_URL to .env so the bot can open your domain."
    )

def verify_telegram_init_data(init_data: str, bot_token: str) -> dict | None:
    data = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = data.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(data.items()))
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if calculated_hash != received_hash:
        return None

    return data


def build_invoice_payload(amount: int, user_id: int) -> str:
    return json.dumps({"amount": amount, "user_id": user_id})


def parse_invoice_payload(payload: str) -> dict | None:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None

    if not isinstance(data, dict):
        return None

    amount = data.get("amount")
    user_id = data.get("user_id")
    if not isinstance(amount, int) or not isinstance(user_id, int):
        return None

    return {"amount": amount, "user_id": user_id}


async def handle_invoice(request: web.Request) -> web.Response:
    bot: Bot = request.app["bot"]
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    parsed = verify_telegram_init_data(init_data, BOT_TOKEN)
    if not parsed:
        return web.json_response({"error": "invalid_init_data"}, status=401)

    amount_raw = request.query.get("amount", "0")
    try:
        amount = int(amount_raw)
    except ValueError:
        return web.json_response({"error": "invalid_amount"}, status=400)

    if amount not in ALLOWED_PRICES:
        return web.json_response({"error": "unsupported_amount"}, status=400)

    user_id: int | None = None
    if "user" in parsed:
        try:
            user_id = json.loads(parsed["user"]).get("id")
        except json.JSONDecodeError:
            user_id = None

    if not isinstance(user_id, int):
        return web.json_response({"error": "invalid_user"}, status=400)

    payload = build_invoice_payload(amount, user_id)
    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {amount} звезд.",
        payload=payload,
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=f"{amount} Stars", amount=amount)],
    )

    return web.json_response({"invoice_link": invoice_link})


async def handle_create_invoice(request: web.Request) -> web.Response:
    bot: Bot = request.app["bot"]
    try:
        data = await request.json()
    except json.JSONDecodeError:
        return web.json_response({"error": "invalid_json"}, status=400)

    amount = data.get("amount")
    if not isinstance(amount, int):
        return web.json_response({"error": "invalid_amount"}, status=400)

    if amount not in ALLOWED_PRICES:
        return web.json_response({"error": "unsupported_amount"}, status=400)

    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description="Random gift",
        payload=json.dumps({"amount": amount}),
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label="Random gift", amount=amount)],
    )

    return web.json_response({"invoiceLink": invoice_link})


async def run_api_server(bot: Bot) -> None:
    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        if request.method == "OPTIONS":
            response = web.Response(status=204)
        else:
            response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Telegram-Init-Data"
        return response

    app = web.Application(middlewares=[cors_middleware])
    app["bot"] = bot
    app.router.add_get("/api/invoice", handle_invoice)
    app.router.add_options("/api/invoice", handle_invoice)
    app.router.add_post("/create-invoice", handle_create_invoice)
    app.router.add_options("/create-invoice", handle_create_invoice)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, API_HOST, API_PORT)
    await site.start()


def build_start_keyboard() -> types.InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=MINI_APP_BUTTON, web_app=types.WebAppInfo(url=MINI_APP_URL))
    builder.adjust(1)
    return builder.as_markup()


async def main() -> None:
    bot = Bot(BOT_TOKEN)
    dp = Dispatcher()

    api_task = asyncio.create_task(run_api_server(bot))

    @dp.message(CommandStart())
    async def handle_start(message: types.Message) -> None:
        text = (
            "Привет! 🎁\n"
            "Жми на кнопку ниже, чтобы открыть мини-приложение и забрать подарки."
        )
        await message.answer(text, reply_markup=build_start_keyboard())

    @dp.pre_checkout_query()
    async def handle_pre_checkout(pre_checkout_query: types.PreCheckoutQuery) -> None:
        payload = parse_invoice_payload(pre_checkout_query.invoice_payload)
        if not payload:
            await pre_checkout_query.answer(ok=False, error_message="Некорректные данные платежа.")
            return

        if pre_checkout_query.currency != "XTR":
            await pre_checkout_query.answer(ok=False, error_message="Неверная валюта.")
            return

        if payload["amount"] not in ALLOWED_PRICES:
            await pre_checkout_query.answer(ok=False, error_message="Некорректная сумма.")
            return

        if pre_checkout_query.total_amount != payload["amount"]:
            await pre_checkout_query.answer(ok=False, error_message="Несовпадение суммы.")
            return

        if pre_checkout_query.from_user.id != payload["user_id"]:
            await pre_checkout_query.answer(ok=False, error_message="Платеж от другого пользователя.")
            return

        await pre_checkout_query.answer(ok=True)

    # Intentionally no successful_payment handler to avoid sending payment notifications.
    await dp.start_polling(bot)
    api_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
