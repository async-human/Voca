from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.services.auth_jwt import decode_access_token
from app.services.supabase import get_supabase_client

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class AuthUser:
    id: str
    email: str | None = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    supabase: Client = Depends(get_supabase_client),
) -> AuthUser:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization token.")

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization token.")

    # Vokal JWT (Google login via API)
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id:
            return AuthUser(id=str(user_id), email=payload.get("email"))
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Sign in again.") from exc
    except jwt.InvalidTokenError:
        pass
    except ValueError:
        pass

    # Legacy Supabase Auth tokens (optional during migration)
    try:
        response = supabase.auth.get_user(token)
        user = response.user if response else None
        if user:
            return AuthUser(id=str(user.id), email=user.email)
    except Exception:
        pass

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")
