# Vokal API (FastAPI)

Python/FastAPI backend with a multi-step voice pipeline.

## Structure

```
api/app/
  main.py                 # FastAPI entry
  config.py               # Env settings
  constants.py
  api/v1/router.py        # Versioned API routes
  api/legacy.py           # Backward-compatible /api/waitlist, /api/recordings
  pipeline/
    orchestrator.py       # Runs full pipeline
    steps.py              # Individual LLM steps
  prompts/                # Prompt templates
  services/               # Supabase, Deepgram, OpenAI, email, sessions, redis, pinecone
  services/tasks.py         # Thread-pool pipeline runner (non-blocking)
  services/voice_profile.py # Deep trait tracking + longitudinal patterns
  models/                 # Pydantic schemas
  utils/auth.py           # JWT verification
```

## Pipeline

```
Audio → STT (Deepgram → Whisper fallback)
     → Clean disfluencies (GPT-4o-mini)
     → Extract intent (GPT-4o)
     → Generate draft (GPT-4o)
     → Self-critique (GPT-4o-mini)
     → Explain changes (GPT-4o)
     → Save + update voice profile (traits, patterns, clarity trends)
     → Upsert vector memory (Pinecone, optional)
     → Delete audio from storage (privacy + cost)
```

Pipeline runs in a **thread pool** so sync I/O does not block the FastAPI event loop.

## Optional infrastructure

| Service | Env vars | Purpose |
|---------|----------|---------|
| Redis | `REDIS_URL` | Session/profile cache, rate limits (in-memory fallback) |
| Pinecone | `PINECONE_API_KEY`, `PINECONE_INDEX` | Vector memory for similar past sessions |
| Cron | `CRON_SECRET` | `POST /api/v1/cron/weekly-insights` weekly email digest |

## Setup

1. Run migrations: `001`–`005` in Supabase
2. Enable Supabase Email auth
3. `pip install -r requirements.txt`
4. Copy `.env.example` → `.env`
5. `uvicorn app.main:app --reload --port 3001`

## API (v1)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/voice/process` | Yes |
| GET | `/api/v1/sessions/{id}` | Yes |
| GET | `/api/v1/sessions/{id}/events` | Yes (SSE) |
| POST | `/api/v1/sessions/{id}/regenerate` | Yes (rate limited) |
| GET | `/api/v1/me` | Yes |
| POST | `/api/v1/waitlist` | No |
| POST | `/api/v1/cron/weekly-insights` | `X-Cron-Secret` header |

Legacy routes `/api/waitlist`, `/api/recordings` remain for the landing page.

## Product UI

Deploy frontend to Vercel, then open **`https://vokal.work/app`**

Required Vercel env vars:
```
VOCA_API_URL=https://your-api.up.railway.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

Supabase → Authentication → URL Configuration:
- Site URL: `https://vokal.work`
- Redirect URLs: `https://vokal.work/auth/callback`, `https://vokal.work/app`
