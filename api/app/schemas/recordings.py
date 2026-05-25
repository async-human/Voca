from pydantic import BaseModel, Field

from app.constants import FORMATS


class RegenerateRequest(BaseModel):
    format: str = Field(..., description="email | slack | report | linkedin | journal")

    def validated_format(self) -> str:
        normalized = self.format.lower()
        if normalized not in FORMATS:
            raise ValueError("Invalid format. Use: email, slack, report, linkedin, journal.")
        return normalized
