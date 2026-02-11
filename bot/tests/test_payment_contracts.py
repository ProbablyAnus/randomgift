import json
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from bot.api import handle_invoice
from bot.bot_handlers import process_pre_checkout_query, process_successful_payment
from bot.payments import build_invoice_payload


class _FakeRequest:
    def __init__(self, amount: int, bot: AsyncMock, db: AsyncMock):
        self.headers = {"X-Telegram-Init-Data": "valid_init_data"}
        self.query = {"amount": str(amount)}
        self.app = {"bot": bot, "db": db}


class _FakePreCheckoutQuery:
    def __init__(self, *, user_id: int, payload_user_id: int, amount: int):
        self.id = "query-1"
        self.currency = "XTR"
        self.total_amount = amount
        self.from_user = SimpleNamespace(id=user_id)
        self.invoice_payload = build_invoice_payload(amount, payload_user_id)
        self.answer = AsyncMock()


class PaymentContractsTest(unittest.IsolatedAsyncioTestCase):
    async def test_invoice_endpoint_returns_invoice_link_for_valid_init_data_and_amount(self):
        bot = AsyncMock()
        bot.create_invoice_link = AsyncMock(return_value="https://t.me/invoice/test-link")
        db = AsyncMock()
        request = _FakeRequest(amount=50, bot=bot, db=db)

        with (
            patch("bot.api.verify_telegram_init_data", return_value={"user": '{"id": 777}'}),
            patch("bot.api.extract_user_from_init_data", return_value={"id": 777}),
        ):
            response = await handle_invoice(request)

        self.assertEqual(response.status, 200)
        body = json.loads(response.text)
        self.assertEqual(body["invoice_link"], "https://t.me/invoice/test-link")
        bot.create_invoice_link.assert_awaited_once()
        db.upsert_user.assert_awaited_once_with({"id": 777})

    async def test_pre_checkout_accepts_matching_user_id(self):
        query = _FakePreCheckoutQuery(user_id=777, payload_user_id=777, amount=50)

        await process_pre_checkout_query(query)

        query.answer.assert_awaited_once_with(ok=True)

    async def test_pre_checkout_rejects_mismatched_user_id(self):
        query = _FakePreCheckoutQuery(user_id=777, payload_user_id=888, amount=50)

        await process_pre_checkout_query(query)

        query.answer.assert_awaited_once_with(ok=False, error_message="Платеж от другого пользователя.")

    async def test_successful_payment_updates_spent_stars_for_payload_user(self):
        db = AsyncMock()
        message = SimpleNamespace(
            message_id=123,
            from_user=SimpleNamespace(
                id=777,
                username="tester",
                first_name="Test",
                last_name="User",
            ),
            successful_payment=SimpleNamespace(
                invoice_payload=build_invoice_payload(50, 777),
                telegram_payment_charge_id="charge-1",
            ),
        )

        await process_successful_payment(message, db)

        db.upsert_user.assert_awaited_once_with(
            {
                "id": 777,
                "username": "tester",
                "first_name": "Test",
                "last_name": "User",
                "photo_url": None,
            }
        )
        db.add_spent_stars.assert_awaited_once_with(777, 50)

    async def test_successful_payment_ignores_invalid_payload(self):
        db = AsyncMock()
        message = SimpleNamespace(
            message_id=123,
            from_user=SimpleNamespace(
                id=777,
                username="tester",
                first_name="Test",
                last_name="User",
            ),
            successful_payment=SimpleNamespace(
                invoice_payload="not-json",
                telegram_payment_charge_id="charge-1",
            ),
        )

        await process_successful_payment(message, db)

        db.upsert_user.assert_not_awaited()
        db.add_spent_stars.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()
