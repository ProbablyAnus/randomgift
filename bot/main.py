import asyncio
import os

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEB_APP_URL = os.getenv("WEB_APP_URL") or os.getenv("APP_PUBLIC_URL")

# MINI_APP_URL можно задать напрямую или оставить пустым, чтобы использовать WEB_APP_URL
MINI_APP_URL = os.getenv("MINI_APP_URL") or WEB_APP_URL
MINI_APP_BUTTON = os.getenv("MINI_APP_BUTTON", "Открыть мини-приложение")

if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN is not set. Add it to .env or the environment before starting the bot.")

if not MINI_APP_URL:
    raise RuntimeError(
        "WEB_APP_URL is not set. Add WEB_APP_URL or MINI_APP_URL to .env so the bot can open your domain."
    )


def build_start_keyboard() -> types.InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=MINI_APP_BUTTON, web_app=types.WebAppInfo(url=MINI_APP_URL))
    builder.adjust(1)
    return builder.as_markup()


async def main() -> None:
    bot = Bot(BOT_TOKEN)
    dp = Dispatcher()

    @dp.message(CommandStart())
    async def handle_start(message: types.Message) -> None:
        text = (
            "Привет! 🎁\n"
            "Жми на кнопку ниже, чтобы открыть мини-приложение и забрать подарки."
        )
        await message.answer(text, reply_markup=build_start_keyboard())

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
