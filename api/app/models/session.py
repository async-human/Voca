from pydantic import BaseModel, Field


class RegenerateRequest(BaseModel):
    format: str = Field(..., description="email | slack | report | linkedin | journal")
