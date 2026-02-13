# Payment Sequence Flow

This document fixes the contract for Stars payments and should be used as the single reference for frontend/backend integration.

## Supported invoice routes

- **Primary route:** `POST /api/payments/invoice`
- Request body:

```json
{
  "amount": 50
}
```

- Telegram auth data is passed in `X-Telegram-Init-Data` header.
- Supported compatibility routes:
  - `POST /api/invoice` (same body/headers)
  - `GET /api/invoice?amount=<value>&init_data=<telegram_init_data>`

## Unified invoice payload schema

Invoice payload is generated only by backend helper `build_invoice_payload(amount, user_id)` and has this JSON format:

```json
{
  "amount": 50,
  "user_id": 123456789
}
```

Rules:
- `amount` is integer and must be one of `ALLOWED_PRICES`.
- `user_id` is integer Telegram user id from validated `initData`.

## End-to-end sequence

1. **Frontend** sends `POST /api/payments/invoice` with `X-Telegram-Init-Data` and `{ amount }`.
2. **Invoice API** validates `initData`, extracts user, validates amount, builds payload via `build_invoice_payload(amount, user_id)`, and calls `create_invoice_link`.
3. **Telegram pre_checkout** event arrives to bot.
4. **pre_checkout handler** parses invoice payload and validates request with the same contract (`amount`, `user_id`, currency, and total amount).
5. On success, Telegram sends **successful_payment** message.
6. **successful_payment handler** parses same payload and calls `add_spent_stars(user_id, amount)`.
7. **Leaderboard API** (`/api/leaderboard`) returns updated totals from DB.

## Contract expectations

- Invoice creation and pre_checkout rely on one payload format.
- If `pre_checkout.from_user.id != payload.user_id`, payment is rejected.
- If payload amount mismatches total or unsupported amount is used, payment is rejected.
