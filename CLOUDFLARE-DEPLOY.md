# Deploying Kokoro Letters on Cloudflare Pages (Free Tier)

Run Kokoro Letters with **\$0/month hosting**, **Firebase Spark** (Firestore), and **Resend** (magic-link & order receipt emails) — starting immediately on `*.pages.dev` even before buying a domain.

## 1. Connect GitHub Repo to Cloudflare Pages
1. Open **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Select **`kiaririka/KOKOROLETTERS`** (`main` branch).
3. Configure Build Settings:
   - **Framework preset:** `Vite` (or `None`)
   - **Build command:** `npx vite build`
   - **Build output directory:** `dist`

## 2. Add Environment Variables (Cloudflare Pages → Settings → Environment variables)
Add these for **Production** (and **Preview** if desired):

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `AUTH_SECRET` | Any random 32+ character string | Signs magic-link tokens and `kokoro_session` cookies (HMAC-SHA256). |
| `RESEND_API_KEY` | `re_...` from [resend.com](https://resend.com) | Free tier gives 3,000 emails/month. |
| `EMAIL_FROM` | `Kokoro Letters <onboarding@resend.dev>` | Use `onboarding@resend.dev` while on `*.pages.dev` (delivers to your own Resend account email). Switch to `Kokoro Letters <letters@yourdomain.com>` after verifying your domain in Resend. |
| `APP_URL` | `https://your-project.pages.dev` | Update to `https://yourdomain.com` once your domain is attached. |

Trigger **Retry deployment** after adding the variables so Cloudflare applies them.

## 3. When You Buy Your Domain Later
1. In Cloudflare Pages → **Custom domains** → attach your domain (`kokoroletters...`).
2. Add your domain in **Resend → Domains** and apply the SPF/DKIM DNS records in Cloudflare DNS.
3. Update `EMAIL_FROM` and `APP_URL` in Cloudflare environment variables, and update `websiteUrl` + `from:` in `scripts/send-monthly-reminder.js`.
4. (Optional) Enable **Cloudflare Email Routing** to forward replies from `letters@yourdomain.com` to your Gmail for free.
