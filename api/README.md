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
| Cron | `CRON_SECRET` | Optional manual trigger for weekly insights endpoint |

**Weekly insights run automatically** every Monday 09:00 UTC via APScheduler when `WEEKLY_INSIGHTS_ENABLED=true` (default). No external cron job required. Set `REDIS_URL` if you run multiple Railway replicas so only one instance sends emails.

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

Supabase → Authentication → URL Configuration (use your Vercel **primary** domain — `www` or apex, consistently):
- Site URL: `https://www.vokal.work` (or `https://vokal.work` if apex is primary)
- Redirect URLs: `https://www.vokal.work/auth/callback`, `https://www.vokal.work/app`

Supabase → Authentication → Providers → **Google** (Studio sign-in):
1. Create a **separate** Google Cloud OAuth client (Web) for Supabase Auth — not the Railway Gmail delivery client.
2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase Google provider and enable it.
4. Vercel: `NEXT_PUBLIC_SITE_URL=https://www.vokal.work` (match your primary domain)
5. **Google branding:** see `docs/google-signin-branding.md` — OAuth consent screen app name **Vokal**; for `vokal.work` instead of `supabase.co` on the prompt, use Supabase **Auth custom domain** (Pro) or your own API OAuth.
