# Deploy Google login (Option B)

## 1. Railway (API) — required first

Push latest `main`, then set variables:

```env
JWT_SECRET=<python -c "import secrets; print(secrets.token_urlsafe(48))">
GOOGLE_CLIENT_ID=<from Google Cloud Vokal client>
GOOGLE_CLIENT_SECRET=<from Google Cloud>
APP_FRONTEND_URL=https://www.vokal.work
GOOGLE_LOGIN_REDIRECT_URI=https://www.vokal.work/auth/callback
GOOGLE_REDIRECT_URI=https://YOUR-API.up.railway.app/api/v1/connections/oauth/gmail/callback
```

Redeploy the **api** service on Railway.

### Verify API (must pass before testing the app)

```text
GET https://YOUR-API.up.railway.app/
→ "version": "3.1.0", "auth": "google-jwt"

GET https://YOUR-API.up.railway.app/api/v1/auth/google/redirect-uri
→ {"redirect_uri":"https://www.vokal.work/auth/callback"}

GET https://YOUR-API.up.railway.app/api/v1/auth/google/start?next=/app/
→ {"url":"https://accounts.google.com/o/oauth2/v2/auth?..."}
```

If you see `{"detail":"Not Found"}`, the API deploy is still on old code.

## 2. Google Cloud

On the **Vokal** Web OAuth client, **Authorized redirect URIs** must include:

```text
https://www.vokal.work/auth/callback
```

## 3. Vercel (frontend)

```env
NEXT_PUBLIC_VOCA_API_URL=https://YOUR-API.up.railway.app
NEXT_PUBLIC_SITE_URL=https://www.vokal.work
```

Redeploy production. Hard refresh `/app/` (Ctrl+Shift+R).

## 4. Sign-in test

1. Open `https://www.vokal.work/app/`
2. DevTools → Network → click **Sign in with Google**
3. First request should be: `GET .../api/v1/auth/google/start`
4. Browser should go to `accounts.google.com` (not `supabase.co`)

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `supabase.co/auth/v1/authorize` | Old Vercel build — redeploy frontend |
| `Not Found` on `/api/v1/auth/google/start` | Old Railway build — redeploy API |
| `JWT_SECRET is not configured` | Add `JWT_SECRET` on Railway |
| `redirect_uri_mismatch` | Add exact URI from `/auth/google/redirect-uri` in Google Console |
| Google shows supabase.co | Old frontend still using Supabase Auth — redeploy Vercel |

Supabase **Authentication → Google** can stay disabled; Studio login does not use it.
