# Vokal API (FastAPI)

Python/FastAPI backend for waitlist + voice → transcription → AI polish pipeline.

## Setup

1. Run Supabase migrations:
   - `supabase/migrations/001_waitlist.sql`
   - `supabase/migrations/002_core_product.sql`

2. Enable **Email** auth in Supabase → Authentication → Providers.

3. Create a virtualenv and install deps:
   ```bash
   cd api
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   ```

4. Run locally:
   ```bash
   uvicorn app.main:app --reload --port 3001
   ```

## Core flow

```
POST /api/recordings  (audio + format)
  → Supabase Storage
  → Whisper transcribe → GPT polish + explanations
  → GET /api/recordings/:id (poll until complete)
```

## Auth

Product routes require a Supabase JWT:

```
Authorization: Bearer <access_token>
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Health check |
| GET | `/api/waitlist/count` | No | Waitlist count |
| POST | `/api/waitlist` | No | Waitlist signup |
| GET | `/api/me` | Yes | User profile |
| GET | `/api/recordings` | Yes | List recordings |
| POST | `/api/recordings` | Yes | Upload audio |
| GET | `/api/recordings/{id}` | Yes | Poll status + result |
| POST | `/api/recordings/{id}/regenerate` | Yes | New format, same transcript |

## Railway deploy

Set root directory to `api/`. Railway runs:

```
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Stack

- **FastAPI** — HTTP API
- **Supabase** — Postgres, Auth, Storage
- **OpenAI** — Whisper + GPT
- **Resend** — Waitlist emails
