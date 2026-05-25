import json
import re
from functools import lru_cache

from openai import OpenAI

from app.config import settings


@lru_cache
def get_openai_client() -> OpenAI:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    return OpenAI(api_key=settings.openai_api_key)


def parse_json_response(raw: str) -> dict:
    trimmed = str(raw or "").strip()
    match = re.search(r"\{[\s\S]*\}", trimmed)
    if not match:
        raise RuntimeError("Model did not return valid JSON")
    return json.loads(match.group(0))


def chat_json(*, system: str, user: str, model: str | None = None, temperature: float = 0.3) -> dict:
    client = get_openai_client()
    completion = client.chat.completions.create(
        model=model or settings.openai_generation_model,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    raw = completion.choices[0].message.content or ""
    return parse_json_response(raw)
