# Show "Vokal" / vokal.work on Google sign-in (not supabase.co)

When you use **Supabase Google OAuth**, Google shows **"Sign in to `your-project.supabase.co`"** because the OAuth redirect URL is:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

That is expected. To brand it as **Vokal**, do the following.

## 1. Google Cloud Console — OAuth consent screen

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **OAuth consent screen**.
2. Set **App name** to `Vokal` (this is what users see as the app name).
3. Upload an **App logo** (square, 120×120+).
4. Add **Authorized domains**: `vokal.work` (and `www.vokal.work` if you use www).
5. Add your support email and save.

## 2. Supabase — use your own Google OAuth client

1. **Google Cloud** → **Credentials** → **Create OAuth client ID** → **Web application**.
2. **Authorized redirect URIs** (exact):
   ```
   https://ixkfqddkwqlxfbuehbsa.supabase.co/auth/v1/callback
   ```
   Replace with your real Supabase project ref from **Supabase → Project Settings → API**.
3. Copy **Client ID** and **Client secret**.
4. **Supabase** → **Authentication** → **Providers** → **Google**:
   - Enable Google
   - Paste **Client ID** and **Client secret** (do not use Supabase’s shared Google app)
   - Save

The consent screen will show **App name: Vokal**, but the domain line may still say `*.supabase.co` until step 3.

## 3. (Best) Supabase Auth custom domain — shows vokal.work

On **Supabase Pro**, add an **Auth custom domain** so OAuth runs on your domain, e.g. `auth.vokal.work`:

- [Supabase: Auth custom domains](https://supabase.com/docs/guides/auth/auth-custom-domains)

Then Google can show **Sign in to vokal.work** because the redirect host is yours.

DNS: CNAME `auth` → Supabase’s target; add that host in Supabase Auth settings.

## 4. Full control (later): your own Google OAuth on Railway

If you skip Supabase Auth and implement `GET /api/v1/auth/google/start` on your API with redirect `https://www.vokal.work/auth/callback`, Google shows **your** domain. That requires JWT/session code on the API (larger change).

## Checklist

| Step | Effect |
|------|--------|
| OAuth consent screen app name + logo | "Vokal" branding, logo on Google UI |
| Own Google client in Supabase | Your Google project, not Supabase shared |
| Auth custom domain `auth.vokal.work` | Domain line shows **vokal.work** |
| Own API OAuth | Full control, no Supabase in login |
