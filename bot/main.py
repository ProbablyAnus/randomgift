import asyncio
import logging

from aiohttp import web
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import CommandStart
from aiogram.types import LabeledPrice
from aiogram.utils.keyboard import InlineKeyboardBuilder
from dotenv import load_dotenv

from config import (
    ALLOWED_PRICES,
    API_HOST,
    API_PORT,
    BOT_TOKEN,
    DB_PATH,
    INIT_DATA_MAX_AGE_SECONDS,
    MINI_APP_BUTTON,
    MINI_APP_URL,
    validate_config,
)
from database import Database
from payments import build_invoice_payload, parse_invoice_payload
from security import extract_user_from_init_data, verify_telegram_init_data

load_dotenv()
validate_config()

logger = logging.getLogger(__name__)


def _parse_user_from_init_data(init_data: str) -> dict | None:
    parsed = verify_telegram_init_data(init_data, BOT_TOKEN, INIT_DATA_MAX_AGE_SECONDS)
    if not parsed:
        return None

    return extract_user_from_init_data(parsed)


async def handle_invoice(request: web.Request) -> web.Response:
    bot: Bot = request.app["bot"]
    db: Database = request.app["db"]

    init_data = request.headers.get("X-Telegram-Init-Data", "")
    user = _parse_user_from_init_data(init_data)
    if not user:
        return web.json_response({"error": "invalid_init_data"}, status=401)

    amount_raw = request.query.get("amount", "0")
    try:
        amount = int(amount_raw)
    except ValueError:
        return web.json_response({"error": "invalid_amount"}, status=400)

    if amount not in ALLOWED_PRICES:
        return web.json_response({"error": "unsupported_amount"}, status=400)

    await db.upsert_user(user)

    payload = build_invoice_payload(amount, int(user["id"]))
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

    init_data = request.headers.get("X-Telegram-Init-Data", "")
    user = _parse_user_from_init_data(init_data)
    if not user:
        return web.json_response({"error": "invalid_init_data"}, status=401)

    await db.upsert_user(user)
    leaderboard = await db.get_leaderboard()
    leaderboard_response = leaderboard if isinstance(leaderboard, list) else []
    return web.json_response({"leaderboard": leaderboard_response})


async def run_api_server(bot: Bot, db: Database) -> None:
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
    app["db"] = db
    app.router.add_get("/api/invoice", handle_invoice)
    app.router.add_options("/api/invoice", handle_invoice)
    app.router.add_get("/api/leaderboard", handle_leaderboard)
    app.router.add_options("/api/leaderboard", handle_leaderboard)

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
    db = Database(DB_PATH)
    await db.init()

    api_task = asyncio.create_task(run_api_server(bot, db))

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

    @dp.message(F.successful_payment)
    async def handle_successful_payment(message: types.Message) -> None:
        payload = parse_invoice_payload(message.successful_payment.invoice_payload)
        if payload:
            await db.add_spent_stars(payload["user_id"], payload["amount"])
            logger.info(
                "payment_recorded",
                extra={"user_id": payload["user_id"], "amount": payload["amount"]},
            )

        await message.answer("Оплата прошла успешно! 🎉")

    await dp.start_polling(bot)
    api_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
