# Payment sequence flow (contract)

## Единственный поддерживаемый маршрут создания инвойса

- **Route:** `POST /api/invoice`
- **Headers:**
  - `X-Telegram-Init-Data: <Telegram.WebApp.initData>`
  - `Content-Type: application/json`
- **Payload schema:**

```json
{
  "amount": 50,
  "user_id": 123456789
}
```

### Правила контракта

1. `amount` должен быть целым числом из разрешенного списка (`ALLOWED_PRICES`).
2. `user_id` должен быть целым числом.
3. `user_id` в payload обязан совпадать с `user.id`, извлеченным из `initData`.
4. Этот же payload (`{"amount": ..., "user_id": ...}`) передается в Telegram invoice payload и валидируется в pre-checkout.

## Sequence flow

1. **Frontend** отправляет `POST /api/invoice` с `amount`, `user_id`, `X-Telegram-Init-Data`.
2. **Invoice API** проверяет `initData`, валидирует payload, создает invoice link.
3. **Telegram pre_checkout_query** приходит в бота, бот валидирует тот же payload (amount/user_id).
4. **successful_payment** обрабатывается ботом и подтверждает корректный payload.
5. **add_spent_stars** увеличивает потраченные звезды пользователя в БД.
6. **leaderboard** читает агрегированные данные и отдает обновленный рейтинг.
