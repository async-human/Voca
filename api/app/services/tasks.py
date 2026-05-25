import logging
from concurrent.futures import ThreadPoolExecutor

from supabase import Client

from app.pipeline.orchestrator import run_pipeline

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="vokal-pipeline")


def submit_pipeline(supabase: Client, recording_id: str) -> None:
    """Queue pipeline in a thread pool so sync I/O does not block the server."""

    def _run() -> None:
        try:
            run_pipeline(supabase, recording_id)
        except Exception:
            logger.exception("Unhandled pipeline error for %s", recording_id)

    _executor.submit(_run)
