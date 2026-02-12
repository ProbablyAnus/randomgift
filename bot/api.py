
from fastapi import FastAPI, Request
from aiogram import Bot
from aiogram.types import LabeledPrice
import os
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()
bot = None


async def create_stars_invoice(bot: Bot, amount: int, user_id: int) -> str:
    payload = f"{user_id}:{amount}"

    prices = [
        LabeledPrice(
            label=f"{amount} ⭐",
            amount=amount
        )
    ]

    invoice_link = await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {amount} звезд.",
        payload=payload,
        currency="XTR",
        prices=prices,
    )

    return invoice_link


@app.post("/api/create-invoice")
async def create_invoice(request: Request):
    data = await request.json()

    amount = int(data["amount"])
    user_id = int(data["user_id"])

    try:
        link = await create_stars_invoice(bot, amount, user_id)
    except Exception as e:
        print("INVOICE ERROR:", repr(e))
        return {"error": str(e)}

    return {"invoiceLink": link}

import uvicorn

async def run_api_server(bot_instance, db_instance, host, port):
    global bot
    bot = bot_instance

    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        loop="asyncio",
        lifespan="off"
    )

    server = uvicorn.Server(config)
    await server.serve()



