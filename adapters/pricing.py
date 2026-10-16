"""Deterministic model-price lookup used for event cost attribution."""

MODEL_PRICES_PER_MILLION: dict[str, tuple[float, float]] = {
    "gpt-4o": (5.0, 15.0),
    "gpt-4o-mini": (0.15, 0.60),
}


def calculate_cost(model: str | None, tokens_in: int, tokens_out: int) -> float:
    rates = MODEL_PRICES_PER_MILLION.get(model or "")
    if rates is None:
        return 0.0
    input_rate, output_rate = rates
    return round((tokens_in * input_rate + tokens_out * output_rate) / 1_000_000, 8)
