# Google sign-in for Vokal Studio (Option B — implemented)

Studio login uses **your Google OAuth client** and redirects to **`https://www.vokal.work/auth/callback`** (not Supabase). Google should show **vokal.work** on the consent screen.

## Flow

1. User clicks **Sign in with Google** on `/app/`
2. Browser opens Google with `redirect_uri=https://www.vokal.work/auth/callback`
3. Google returns to `/auth/callback?code=...`
4. Frontend calls `POST /api/v1/auth/google/complete` on Railway
5. API creates/finds user in Supabase `auth.users`, returns **JWT**
6. Frontend stores JWT and opens Studio

Gmail **Connect** still uses a separate redirect: `…/api/v1/connections/oauth/gmail/callback`.

## Google Cloud — one Web client, two redirect URIs

| URI | Purpose |
|-----|---------|
| `https://www.vokal.work/auth/callback` | Studio login |
| `https://YOUR-API.up.railway.app/api/v1/connections/oauth/gmail/callback` | Send via Gmail |

**Authorized JavaScript origins:** `https://www.vokal.work`, `https://vokal.work`, `http://localhost:3000`

**Branding:** App name `Vokal`, authorized domain `vokal.work`

## Railway env vars

```env
JWT_SECRET=<random 48+ chars>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APP_FRONTEND_URL=https://www.vokal.work
GOOGLE_LOGIN_REDIRECT_URI=https://www.vokal.work/auth/callback
GOOGLE_REDIRECT_URI=https://YOUR-API.up.railway.app/api/v1/connections/oauth/gmail/callback
```

Generate JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Redeploy API after setting env vars.

## Vercel

```env
NEXT_PUBLIC_VOCA_API_URL=https://YOUR-API.up.railway.app
NEXT_PUBLIC_SITE_URL=https://www.vokal.work
```

Supabase anon keys are **not** required for Studio login anymore (API still uses service role on Railway).

## Verify redirect URI

`GET https://YOUR-API.up.railway.app/api/v1/auth/google/redirect-uri`

Should return `https://www.vokal.work/auth/callback`.
