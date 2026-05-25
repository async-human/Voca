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
  services/               # Supabase, Deepgram, OpenAI, email, sessions
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
     → Save + update voice profile
```

## Setup

1. Run migrations: `001_waitlist.sql`, `002_core_product.sql`, `003_pipeline_fields.sql`
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
| POST | `/api/v1/sessions/{id}/regenerate` | Yes |
| GET | `/api/v1/me` | Yes |
| POST | `/api/v1/waitlist` | No |

Legacy routes `/api/waitlist`, `/api/recordings` remain for the landing page.

## Product UI

Deploy frontend to Vercel, then open **`https://vokal.work/app.html`**

Required Vercel env vars:
```
VOCA_API_URL=https://your-api.up.railway.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

Supabase → Authentication → URL Configuration:
- Site URL: `https://vokal.work`
- Redirect URLs: `https://vokal.work/app.html`
