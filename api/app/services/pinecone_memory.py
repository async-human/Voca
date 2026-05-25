"""Optional Pinecone vector memory for voice session retrieval."""

from __future__ import annotations

import logging
import uuid

from app.config import settings
from app.services.openai_client import create_embedding

logger = logging.getLogger(__name__)

_index = None
_init_attempted = False


def _get_index():
    global _index, _init_attempted
    if _init_attempted:
        return _index
    _init_attempted = True

    if not settings.pinecone_api_key or not settings.pinecone_index:
        return None

    try:
        from pinecone import Pinecone

        pc = Pinecone(api_key=settings.pinecone_api_key)
        _index = pc.Index(settings.pinecone_index)
        logger.info("Pinecone index connected: %s", settings.pinecone_index)
        return _index
    except Exception as exc:
        logger.warning("Pinecone unavailable: %s", exc)
        return None


def upsert_session_memory(
    *,
    user_id: str,
    recording_id: str,
    text: str,
    output_format: str,
    clarity_score: float | None = None,
) -> None:
    index = _get_index()
    if not index or not text.strip():
        return

    try:
        vector = create_embedding(text)
        metadata = {
            "user_id": user_id,
            "recording_id": recording_id,
            "format": output_format,
        }
        if clarity_score is not None:
            metadata["clarity_score"] = clarity_score

        index.upsert(vectors=[{
            "id": f"{user_id}:{recording_id}",
            "values": vector,
            "metadata": metadata,
        }])
    except Exception as exc:
        logger.warning("Pinecone upsert failed: %s", exc)


def query_similar_sessions(*, user_id: str, text: str, top_k: int = 3) -> list[dict]:
    index = _get_index()
    if not index or not text.strip():
        return []

    try:
        vector = create_embedding(text)
        result = index.query(
            vector=vector,
            top_k=top_k,
            filter={"user_id": {"$eq": user_id}},
            include_metadata=True,
        )
        return [
            {"id": m.id, "score": m.score, "metadata": m.metadata or {}}
            for m in (result.matches or [])
        ]
    except Exception as exc:
        logger.warning("Pinecone query failed: %s", exc)
        return []
