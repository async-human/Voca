import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from supabase import Client

from app.constants import USE_CASES
from app.deps import get_supabase
from app.schemas.waitlist import WaitlistCountResponse, WaitlistResponse, WaitlistSignup
from app.services.email import send_waitlist_emails

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])


@router.get("/count", response_model=WaitlistCountResponse)
def waitlist_count(supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.table("waitlist").select("*", count="exact").execute()
        return {"count": result.count or 0}
    except Exception as exc:
        logger.exception("Count error")
        raise HTTPException(status_code=500, detail="Could not fetch waitlist count") from exc


@router.post("", response_model=WaitlistResponse, status_code=status.HTTP_201_CREATED)
def waitlist_signup(
    payload: WaitlistSignup,
    background_tasks: BackgroundTasks,
    supabase: Client = Depends(get_supabase),
):
    if payload.website:
        return WaitlistResponse(message="You're on the list — we'll be in touch soon")

    use_case = payload.use_case if payload.use_case in USE_CASES else None

    try:
        result = (
            supabase.table("waitlist")
            .insert({
                "email": payload.email,
                "use_case": use_case,
                "source": payload.source[:64],
                "referrer": payload.referrer[:512] if payload.referrer else None,
                "utm_source": payload.utm_source[:128] if payload.utm_source else None,
                "utm_medium": payload.utm_medium[:128] if payload.utm_medium else None,
                "utm_campaign": payload.utm_campaign[:128] if payload.utm_campaign else None,
            })
            .select("id, email, created_at")
            .execute()
        )
    except Exception as exc:
        message = str(exc)
        if "23505" in message or "duplicate" in message.lower():
            raise HTTPException(status_code=409, detail="You're already on the waitlist.") from exc
        logger.exception("Signup error")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.") from exc

    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again.")

    row = rows[0]
    created_at = row.get("created_at")
    if isinstance(created_at, str):
        created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    else:
        created_dt = datetime.now(timezone.utc)

    background_tasks.add_task(
        send_waitlist_emails,
        email=payload.email,
        use_case=use_case,
        source=payload.source[:64],
        referrer=payload.referrer,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        created_at=created_dt,
    )

    return WaitlistResponse(message="You're on the list — we'll be in touch soon", id=row.get("id"))
