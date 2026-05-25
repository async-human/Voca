from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass
class DeliveryResult:
    status: str  # sent | failed
    external_id: str | None = None
    message: str | None = None
    metadata: dict[str, Any] | None = None


class DeliveryHandler(Protocol):
    platform: str

    def send(
        self,
        *,
        content: str,
        subject: str | None,
        destination: dict[str, Any],
        credentials: dict[str, Any],
        connection_metadata: dict[str, Any],
    ) -> DeliveryResult: ...
