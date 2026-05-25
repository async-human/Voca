from pydantic import BaseModel, Field


SUPPORTED_PLATFORMS = frozenset({"gmail", "slack", "notion", "linkedin", "zapier"})


class ZapierConnectRequest(BaseModel):
    webhook_url: str = Field(..., min_length=8)
    label: str = Field(default="Zapier", max_length=80)


class NotionConnectMetadataRequest(BaseModel):
    database_id: str = Field(..., min_length=8)
    label: str | None = Field(default=None, max_length=80)


class DeliverRequest(BaseModel):
    connection_id: str
    destination: dict = Field(default_factory=dict)
    output_text: str | None = Field(default=None, description="Optional edited text; defaults to saved generation")


class DeliverResponse(BaseModel):
    attempt_id: str
    status: str
    platform: str
    external_id: str | None = None
    message: str | None = None
