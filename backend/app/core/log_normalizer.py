"""Redis-field decoding and validation for the canonical event contract."""
import json
from dataclasses import dataclass
from typing import Any
from pydantic import ValidationError
from app.models.event import Event

@dataclass(slots=True)
class NormalizationFailure:
    reason: str
    errors: list[dict[str, Any]]
    raw: dict[str, Any]

class LogNormalizer:
    def normalize(self, fields: dict[Any, Any]) -> Event:
        decoded = {self._decode(k): self._decode(v) for k, v in fields.items()}
        raw: Any = decoded
        if "payload" in decoded and isinstance(decoded["payload"], str):
            try: raw = json.loads(decoded["payload"])
            except json.JSONDecodeError as exc: raise ValueError(NormalizationFailure("invalid_json", [{"msg": str(exc)}], decoded)) from exc
        if not isinstance(raw, dict): raise ValueError(NormalizationFailure("invalid_shape", [{"msg": "event must be an object"}], decoded))
        try: return Event.model_validate(raw)
        except ValidationError as exc: raise ValueError(NormalizationFailure("validation_error", exc.errors(), raw)) from exc
    @staticmethod
    def _decode(value: Any) -> Any: return value.decode("utf-8") if isinstance(value, bytes) else value
