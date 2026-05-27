from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["low", "medium", "high"]


class WorkflowAction(BaseModel):
    id: str
    type: str
    title: str
    payload: dict[str, Any] = Field(default_factory=dict)
    requires_approval: bool = True
    approval_reason: str | None = None
    status: str = "pending"


class WorkflowState(BaseModel):
    session_id: str | None = None
    user_id: str
    transcript: str
    requested_format: str
    domain: str | None = None
    workflow_type: str | None = None
    entities: dict[str, Any] = Field(default_factory=dict)
    context: dict[str, Any] = Field(default_factory=dict)
    actions: list[WorkflowAction] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    approval_required: bool = True
    approval_reason: str | None = None
    risk_level: RiskLevel = "medium"
    execution_status: str = "pending"

    def approval_bundle(self) -> dict[str, Any]:
        return {
            "workflow_type": self.workflow_type,
            "domain": self.domain,
            "risk_level": self.risk_level,
            "approval_required": self.approval_required,
            "approval_reason": self.approval_reason,
            "missing_fields": self.missing_fields,
            "actions": [action.model_dump() for action in self.actions],
        }
