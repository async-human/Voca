import json
import re
import threading

from openai import APIConnectionError, APITimeoutError, InternalServerError, OpenAI, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

_client: OpenAI | None = None
_client_lock = threading.Lock()

_RETRYABLE = (APIConnectionError, APITimeoutError, RateLimitError, InternalServerError)


def get_openai_client() -> OpenAI:
    global _client
    if _client is not None:
        return _client
    with _client_lock:
        if _client is None:
            if not settings.openai_api_key:
                raise RuntimeError("OPENAI_API_KEY is not configured")
            _client = OpenAI(api_key=settings.openai_api_key)
        return _client


def reset_openai_client() -> None:
    global _client
    with _client_lock:
        _client = None


def parse_json_response(raw: str) -> dict:
    trimmed = str(raw or "").strip()
    match = re.search(r"\{[\s\S]*\}", trimmed)
    if not match:
        raise RuntimeError("Model did not return valid JSON")
    return json.loads(match.group(0))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(_RETRYABLE),
    reraise=True,
)
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


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(_RETRYABLE),
    reraise=True,
)
def create_embedding(text: str) -> list[float]:
    client = get_openai_client()
    response = client.embeddings.create(
        model=settings.openai_embedding_model,
        input=text[:8000],
    )
    return response.data[0].embedding
