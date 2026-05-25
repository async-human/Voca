"""In-process job scheduler — no external cron required."""

from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.services.insights import send_weekly_insights
from app.services.redis_cache import run_with_lock
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _run_weekly_insights() -> None:
    if not settings.resend_api_key or not settings.resend_from_email:
        logger.info("Weekly insights skipped — Resend not configured")
        return

    def _send() -> None:
        supabase = get_supabase_client()
        result = send_weekly_insights(supabase)
        logger.info("Weekly insights job finished: %s", result)

    # With multiple Railway replicas, only one instance sends emails
    ran = run_with_lock("weekly-insights", ttl_seconds=3600, fn=_send)
    if not ran:
        logger.info("Weekly insights skipped — another instance is handling it")


def start_scheduler() -> None:
    global _scheduler
    if not settings.weekly_insights_enabled:
        logger.info("Scheduled jobs disabled (WEEKLY_INSIGHTS_ENABLED=false)")
        return
    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(
        _run_weekly_insights,
        CronTrigger(
            day_of_week=settings.weekly_insights_day,
            hour=settings.weekly_insights_hour,
            minute=0,
        ),
        id="weekly_insights",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Scheduler started — weekly insights every %s at %02d:00 UTC",
        settings.weekly_insights_day,
        settings.weekly_insights_hour,
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler stopped")
