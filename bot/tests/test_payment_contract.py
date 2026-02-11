import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock

from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

import api
from bot_handlers import process_pre_checkout
from payments import build_invoice_payload


class PaymentContractTests(unittest.IsolatedAsyncioTestCase):
    async def test_invoice_link_created_for_valid_init_data_and_amount(self):
        bot = AsyncMock()
        bot.create_invoice_link = AsyncMock(return_value="https://t.me/invoice/test")

        db = AsyncMock()
        db.upsert_user = AsyncMock()

        original_verify = api.verify_telegram_init_data
        original_extract = api.extract_user_from_init_data
        original_token = api.BOT_TOKEN

        api.verify_telegram_init_data = lambda *_args, **_kwargs: {"user": "ok"}
        api.extract_user_from_init_data = lambda _parsed: {"id": 777, "username": "tester"}
        api.BOT_TOKEN = "token"

        app = web.Application()
        app["bot"] = bot
        app["db"] = db
        app.router.add_post("/api/invoice", api.handle_invoice)

        server = TestServer(app)
        client = TestClient(server)
        await client.start_server()

        try:
            response = await client.post(
                "/api/invoice",
                headers={"X-Telegram-Init-Data": "valid"},
                json={"amount": 50, "user_id": 777},
            )
            self.assertEqual(response.status, 200)
            body = await response.json()
            self.assertEqual(body["invoice_link"], "https://t.me/invoice/test")
            bot.create_invoice_link.assert_awaited_once()
        finally:
            await client.close()
            api.verify_telegram_init_data = original_verify
            api.extract_user_from_init_data = original_extract
            api.BOT_TOKEN = original_token

    async def test_pre_checkout_accepts_matching_user_id(self):
        query = SimpleNamespace(
            invoice_payload=build_invoice_payload(50, 777),
            currency="XTR",
            total_amount=50,
            from_user=SimpleNamespace(id=777),
            answer=AsyncMock(),
        )

        await process_pre_checkout(query)

        query.answer.assert_awaited_once_with(ok=True)

    async def test_pre_checkout_rejects_user_mismatch(self):
        query = SimpleNamespace(
            invoice_payload=build_invoice_payload(50, 777),
            currency="XTR",
            total_amount=50,
            from_user=SimpleNamespace(id=888),
            answer=AsyncMock(),
        )

        await process_pre_checkout(query)

        query.answer.assert_awaited_once_with(ok=False, error_message="Платеж от другого пользователя.")


if __name__ == "__main__":
    unittest.main()
