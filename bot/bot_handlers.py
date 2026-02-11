from aiogram import Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import ALLOWED_PRICES, MINI_APP_BUTTON, MINI_APP_URL
from database import Database
from payments import parse_invoice_payload, validate_invoice_payload


def build_start_keyboard() -> types.InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=MINI_APP_BUTTON, web_app=types.WebAppInfo(url=MINI_APP_URL))
    builder.adjust(1)
    return builder.as_markup()


async def process_pre_checkout(pre_checkout_query: types.PreCheckoutQuery) -> None:
    payload = parse_invoice_payload(pre_checkout_query.invoice_payload)
    if not payload:
        await pre_checkout_query.answer(ok=False, error_message="Некорректные данные платежа.")
        return

    if pre_checkout_query.currency != "XTR":
        await pre_checkout_query.answer(ok=False, error_message="Неверная валюта.")
        return

    validation_error = validate_invoice_payload(
        payload,
        ALLOWED_PRICES,
        pre_checkout_query.total_amount,
        pre_checkout_query.from_user.id,
    )
    if validation_error == "invalid_amount":
        await pre_checkout_query.answer(ok=False, error_message="Некорректная сумма.")
        return

    if validation_error == "amount_mismatch":
        await pre_checkout_query.answer(ok=False, error_message="Несовпадение суммы.")
        return

    if validation_error == "user_mismatch":
        await pre_checkout_query.answer(ok=False, error_message="Платеж от другого пользователя.")
        return

    await pre_checkout_query.answer(ok=True)


def register_bot_handlers(dp: Dispatcher, db: Database) -> None:
    @dp.message(CommandStart())
    async def handle_start(message: types.Message) -> None:
        await db.upsert_user(
            {
                "id": message.from_user.id,
                "username": message.from_user.username,
                "first_name": message.from_user.first_name,
                "last_name": message.from_user.last_name,
                "photo_url": None,
            }
        )
        text = (
            "Привет! 🎁\n"
            "Жми на кнопку ниже, чтобы открыть мини-приложение и забрать подарки."
        )
        await message.answer(text, reply_markup=build_start_keyboard())

    @dp.pre_checkout_query()
    async def handle_pre_checkout(pre_checkout_query: types.PreCheckoutQuery) -> None:
        await process_pre_checkout(pre_checkout_query)

    @dp.message(lambda message: message.successful_payment is not None)
    async def handle_successful_payment(message: types.Message) -> None:
        successful_payment = message.successful_payment
        if not successful_payment:
            return

        payload = parse_invoice_payload(successful_payment.invoice_payload)
        if not payload:
            return

        await db.upsert_user(
            {
                "id": message.from_user.id,
                "username": message.from_user.username,
                "first_name": message.from_user.first_name,
                "last_name": message.from_user.last_name,
                "photo_url": None,
            }
        )
        await db.add_spent_stars(payload["user_id"], payload["amount"])
