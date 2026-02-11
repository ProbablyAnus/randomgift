import json


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

    payload_id = data.get("id")
    if payload_id is not None and not isinstance(payload_id, (str, int)):
        return None

    correlation_id = data.get("correlation_id")
    if correlation_id is not None and not isinstance(correlation_id, str):
        return None

    return {
        "amount": amount,
        "user_id": user_id,
        "id": str(payload_id) if payload_id is not None else None,
        "correlation_id": correlation_id,
    }
