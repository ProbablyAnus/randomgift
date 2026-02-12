import logging

from aiogram import Bot
from aiogram.types import LabeledPrice
from fastapi import FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from config import ALLOWED_PRICES, BOT_TOKEN, CORS_ALLOW_ORIGIN, INIT_DATA_MAX_AGE_SECONDS
from payments import build_invoice_payload
from security import extract_user_from_init_data, verify_telegram_init_data


logger = logging.getLogger(__name__)

app = FastAPI()

if CORS_ALLOW_ORIGIN:
    allow_origins = [origin.strip() for origin in CORS_ALLOW_ORIGIN.split(",") if origin.strip()]
    if allow_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allow_origins,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
        )
        logger.info("cors_enabled", extra={"allow_origins": allow_origins})


async def create_stars_invoice(bot: Bot, amount: int, user_id: int) -> str:
    prices = [
        LabeledPrice(
            label=f"{amount} ⭐",
            amount=amount,
        )
    ]

    return await bot.create_invoice_link(
        title="Random Gift",
        description=f"Покупка подарка за {amount} звезд.",
        payload=build_invoice_payload(amount, user_id),
        currency="XTR",
        prices=prices,
    )


@app.get("/api/invoice")
async def handle_invoice(
    amount: int = Query(...),
    init_data: str | None = Query(default=None),
    x_telegram_init_data: str | None = Header(default=None),
):
    effective_init_data = x_telegram_init_data or init_data

    logger.info(
        "invoice_request_received",
        extra={
            "amount": amount,
            "has_init_data": bool(effective_init_data),
            "init_data_source": "header" if x_telegram_init_data else ("query" if init_data else "missing"),
        },
    )

    if amount not in ALLOWED_PRICES:
        logger.warning("invoice_request_invalid_amount", extra={"amount": amount})
        return JSONResponse(status_code=400, content={"error": "invalid_amount"})

    if not effective_init_data:
        logger.warning("invoice_request_missing_init_data")
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    parsed_init_data = verify_telegram_init_data(
        effective_init_data,
        BOT_TOKEN,
        INIT_DATA_MAX_AGE_SECONDS,
    )
    if not parsed_init_data:
        logger.warning("invoice_request_invalid_init_data")
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    user = extract_user_from_init_data(parsed_init_data)
    if not user:
        logger.warning("invoice_request_user_missing_in_init_data")
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    db = app.state.db
    bot = app.state.bot

    await db.upsert_user(user)

    try:
        invoice_link = await create_stars_invoice(bot, amount, int(user["id"]))
    except Exception:
        logger.exception("invoice_creation_failed", extra={"user_id": user.get("id"), "amount": amount})
        return JSONResponse(status_code=500, content={"error": "invoice_creation_failed"})

    return {"invoice_link": invoice_link}


@app.post("/api/create-invoice")
@app.post("/create-invoice")
async def create_invoice_legacy(payload: dict):
    amount = payload.get("amount")
    user_id = payload.get("user_id")

    if not isinstance(amount, int) or amount not in ALLOWED_PRICES:
        return JSONResponse(status_code=400, content={"error": "invalid_amount"})

    if not isinstance(user_id, int):
        return JSONResponse(status_code=400, content={"error": "invalid_user_id"})

    try:
        invoice_link = await create_stars_invoice(app.state.bot, amount, user_id)
    except Exception:
        logger.exception("invoice_creation_failed", extra={"user_id": user_id, "amount": amount})
        return JSONResponse(status_code=500, content={"error": "invoice_creation_failed"})

    return {"invoiceLink": invoice_link}


@app.get("/api/leaderboard")
async def handle_leaderboard(x_telegram_init_data: str | None = Header(default=None)):
    if not x_telegram_init_data:
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    parsed_init_data = verify_telegram_init_data(
        x_telegram_init_data,
        BOT_TOKEN,
        INIT_DATA_MAX_AGE_SECONDS,
    )
    if not parsed_init_data:
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    user = extract_user_from_init_data(parsed_init_data)
    if not user:
        return JSONResponse(status_code=401, content={"error": "invalid_init_data"})

    await app.state.db.upsert_user(user)
    leaderboard = await app.state.db.get_leaderboard()
    return {"leaderboard": leaderboard}


async def run_api_server(bot_instance, db_instance, host, port):
    app.state.bot = bot_instance
    app.state.db = db_instance

    config = uvicorn.Config(
        app,
        host=host,
        port=port,
        loop="asyncio",
        lifespan="off",
    )

    server = uvicorn.Server(config)
    await server.serve()
