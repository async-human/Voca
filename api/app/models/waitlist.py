import re

from pydantic import BaseModel, field_validator


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class WaitlistSignup(BaseModel):
    email: str
    use_case: str | None = None
    source: str = "landing"
    website: str | None = None
    referrer: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise ValueError("Please enter a valid email address.")
        return normalized


class WaitlistResponse(BaseModel):
    ok: bool = True
    message: str
    id: str | None = None
