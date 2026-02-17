# JFDI Deployment Guide

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Node.js | >= 22 | `node -v` |
| npm | >= 10 | `npm -v` |
| Turso CLI | latest | `turso --version` |
| Vercel CLI (optional) | latest | `vercel --version` |
| GitHub repo | Connected | `git remote -v` |

---

## 1. Turso Cloud Database

### Create the database

```bash
# Install Turso CLI (if not already installed)
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create jfdi

# Get connection URL
turso db show jfdi --url

# Create auth token
turso db tokens create jfdi
```

Save the URL and token — you'll need them for Vercel env vars.

### Verify connection

```bash
# Test connection
turso db shell jfdi "SELECT 1;"
```

Tables auto-initialize on first request (via `initializeDatabase()` in `src/lib/db.ts`). No migration step needed for a fresh deploy.

### Seed data (optional)

To seed production with sample data, temporarily set env vars and run:

```bash
TURSO_DATABASE_URL=libsql://jfdi-<org>.turso.io \
TURSO_AUTH_TOKEN=<token> \
npm run seed
```

---

## 2. Google OAuth Setup

### Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select the `gmail-brain` project (or create a new one)
3. Enable APIs: Google Calendar API, Gmail API
4. Go to **APIs & Services > Credentials**
5. Edit your OAuth 2.0 Client ID
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (dev)
   - `https://jfdi.bartlettlabs.io/api/auth/callback` (production — update domain as needed)
7. Save

### Environment variables

```
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-<your-secret>
GOOGLE_REDIRECT_URI=https://jfdi.bartlettlabs.io/api/auth/callback
```

---

## 3. Vercel Deployment

### Connect repository

```bash
# From project root
vercel link
```

Or connect via [vercel.com/new](https://vercel.com/new) > Import Git Repository.

### Set environment variables

In Vercel Dashboard > Project Settings > Environment Variables, add:

| Variable | Value | Required |
|---|---|---|
| `TURSO_DATABASE_URL` | `libsql://jfdi-<org>.turso.io` | Yes |
| `TURSO_AUTH_TOKEN` | `<turso-token>` | Yes |
| `GOOGLE_CLIENT_ID` | `<client-id>.apps.googleusercontent.com` | Yes |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-<secret>` | Yes |
| `GOOGLE_REDIRECT_URI` | `https://<your-domain>/api/auth/callback` | Yes |
| `ANTHROPIC_API_KEY` | `<anker-proxy-key>` | Yes (for AI features) |
| `LARK_APP_ID` | `<lark-app-id>` | Optional |
| `LARK_APP_SECRET` | `<lark-app-secret>` | Optional |
| `OPENWEATHERMAP_API_KEY` | `<owm-key>` | Optional |
| `OPENWEATHERMAP_CITY` | `Shenzhen` | Optional |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` | Yes |

### Deploy

```bash
# Deploy to production
vercel --prod

# Or push to GitHub and let Vercel auto-deploy
git push origin master
```

### Build settings

Vercel auto-detects Next.js. No custom build settings needed. Framework: Next.js, Build Command: `next build`, Output Directory: `.next`.

---

## 4. Custom Domain

### In Vercel

1. Go to Project Settings > Domains
2. Add `jfdi.bartlettlabs.io` (or your chosen domain)
3. Follow DNS instructions (CNAME or A record)

### Update env vars

After domain is live, update:
- `GOOGLE_REDIRECT_URI` to use the new domain
- `NEXT_PUBLIC_APP_URL` to use the new domain
- Google OAuth redirect URI in Cloud Console

---

## 5. OpenWeatherMap (Optional)

1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Get a free API key from the API Keys page
3. Set `OPENWEATHERMAP_API_KEY` in Vercel env vars
4. Set `OPENWEATHERMAP_CITY` (default: `Shenzhen`)

---

## 6. Lark/Feishu (Optional)

If using Lark calendar integration:

1. Create a Lark Open Platform app at [open.feishu.cn](https://open.feishu.cn)
2. Get App ID and App Secret
3. Set `LARK_APP_ID` and `LARK_APP_SECRET` in Vercel env vars
4. Configure scopes: `calendar:calendar:readonly`, `calendar:calendar_event:read`

---

## 7. Post-Deployment Checklist

- [ ] Visit `https://<domain>` — dashboard loads
- [ ] Click "Connect Google" — OAuth flow completes
- [ ] Calendar events appear on dashboard
- [ ] Create a reminder — persists after refresh
- [ ] Create a project + tasks
- [ ] Chat with Claude — AI responds
- [ ] Weather widget shows data (if OpenWeatherMap configured)
- [ ] Run `npm test` locally to confirm no regressions

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "redirect_uri_mismatch" on Google OAuth | Add production URL to Google Cloud Console redirect URIs |
| Database tables don't exist | Tables auto-create on first request. Check Turso URL/token are correct |
| AI chat returns errors | Verify `ANTHROPIC_API_KEY` is set and Anker VPN is active (if using corporate proxy) |
| Build fails on Vercel | Check `npm run build` passes locally first |
| Weather widget empty | Get free API key from openweathermap.org |
