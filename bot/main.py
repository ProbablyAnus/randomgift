import asyncio
import hashlib
import hmac
import json
import os
from urllib.parse import parse_qsl

from aiohttp import web
from aiogram import Bot, Dispatcher, F, types
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

    user_payload = ""
    if "user" in parsed:
        try:
            user_payload = json.loads(parsed["user"]).get("id", "")
        except json.JSONDecodeError:
            user_payload = ""

    payload = f"gift:{amount}:{user_payload}"
    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {amount} звезд.",
        payload=payload,
        provider_token="",
        currency="XTR",
        prices=[LabeledPrice(label=f"{amount} Stars", amount=amount)],
    )

    return web.json_response({"invoice_link": invoice_link})


async def run_api_server(bot: Bot) -> None:
    @web.middleware
    async def cors_middleware(request: web.Request, handler):
        if request.method == "OPTIONS":
            response = web.Response(status=204)
        else:
            response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Telegram-Init-Data"
        return response

    app = web.Application(middlewares=[cors_middleware])
    app["bot"] = bot
    app.router.add_get("/api/invoice", handle_invoice)
    app.router.add_options("/api/invoice", handle_invoice)

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
        await pre_checkout_query.answer(ok=True)

    @dp.message(F.successful_payment)
    async def handle_successful_payment(message: types.Message) -> None:
        await message.answer("Оплата прошла успешно! 🎉")

    await dp.start_polling(bot)
    api_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
