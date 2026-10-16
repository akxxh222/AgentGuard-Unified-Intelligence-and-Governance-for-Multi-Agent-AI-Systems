from adapters.pricing import calculate_cost


def test_known_model_cost_uses_input_and_output_rates():
    assert calculate_cost("gpt-4o", 1_000_000, 1_000_000) == 20.0


def test_unknown_model_cost_is_zero():
    assert calculate_cost("custom-local-model", 50_000, 25_000) == 0.0
    assert calculate_cost(None, 50_000, 25_000) == 0.0
