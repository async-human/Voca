from pydantic import BaseModel


class GoogleCompleteRequest(BaseModel):
    code: str
    state: str | None = None


class AuthUserResponse(BaseModel):
    id: str
    email: str | None = None
    name: str | None = None
    picture: str | None = None


class GoogleCompleteResponse(BaseModel):
    access_token: str
    user: AuthUserResponse
    next: str = "/app/"


class GoogleStartResponse(BaseModel):
    url: str
