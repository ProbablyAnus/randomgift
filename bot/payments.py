import json


INVOICE_API_ROUTE = "/api/invoice"


def build_invoice_payload(amount: int, user_id: int) -> str:
    return json.dumps({"amount": amount, "user_id": user_id})


def parse_invoice_payload(payload: str) -> dict | None:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None

    if not isinstance(data, dict):
        return None

    amount = data.get("amount")
    user_id = data.get("user_id")
    if not isinstance(amount, int) or not isinstance(user_id, int):
        return None

    return {"amount": amount, "user_id": user_id}


def parse_invoice_request_payload(payload: dict) -> dict | None:
    if not isinstance(payload, dict):
        return None

    amount = payload.get("amount")
    user_id = payload.get("user_id")
    if not isinstance(amount, int) or not isinstance(user_id, int):
        return None

    return {"amount": amount, "user_id": user_id}


def validate_invoice_payload(payload: dict, allowed_prices: set[int], total_amount: int, user_id: int) -> str | None:
    if payload["amount"] not in allowed_prices:
        return "invalid_amount"

    if total_amount != payload["amount"]:
        return "amount_mismatch"

    if user_id != payload["user_id"]:
        return "user_mismatch"

    return None
