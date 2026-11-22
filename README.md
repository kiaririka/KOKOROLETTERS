<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Kokoro Letters 心

> *Handcrafted monthly letters from Japan's twelve Ghibli-inspired regions.*

An interactive subscription site with a Japan map, region lore, animated unlocking, and a full checkout + auth demo — deployable as a **completely static site on GitHub Pages** (no server required).

---

## 🚀 Deploy to GitHub Pages (zero config)

1. Push this repo to GitHub (`main` branch).
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. The workflow (`.github/workflows/deploy-preview.yml`) builds and deploys automatically on every push.
4. Your live URL will appear in the Actions run summary.

> **What works in the static preview:** interactive map, region lock/unlock animations, magic-link demo login, full checkout flow, ambient sounds, FAQ, monthly letter showcase, newsletter form, admin view.  
> No real payments or emails are sent — data is stored in this browser's `localStorage`.

---

## 🛠 Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install

# Full-stack dev (requires Firebase + SMTP config in .env):
npm run dev

# Static preview build (no server, works offline):
npm run build:preview
npx vite preview --outDir dist-preview
```

Open `http://localhost:4173` for the preview build.

---

## 📂 Project Structure

```
src/
  App.tsx                   # Main app (tabs: Journey, Subscription, Journal, Newsletter, Admin)
  previewApi.ts             # In-browser API shim (intercepts /api/* for static hosting)
  waitlist.ts               # Optional Google Form waitlist integration
  components/
    JapanMap.tsx            # Interactive SVG Japan map with region selection
    MonthlyLetterShowcase.tsx
    AdminDashboard.tsx
    FaqSection.tsx
  data/
    lore.ts                 # Region metadata + release dates
    lore/*.json             # Per-region lore content
server/
  db.ts                     # Firestore server SDK (production only)
server.ts                   # Express API server (production only)
.github/workflows/
  deploy-preview.yml        # GitHub Actions: build preview → gh-pages
```

---

## 🔐 Production (real auth + payments)

The `server.ts` runs a full Express + Firestore backend with:
- Passwordless magic link auth (SMTP)
- Razorpay + PayPal webhook handlers
- Per-subscriber region unlocking

Configure `.env` from `.env.example` and deploy to any Node.js host (Railway, Render, Fly.io, Cloud Run).

---

## 🌿 Make the waitlist real

1. Create a Google Form with a single "Email" short-answer field.
2. Get the form's `/formResponse` URL and the `entry.XXXXXXXXXX` field id.
3. Add both to `.env.preview`:
   ```
   VITE_WAITLIST_FORM_URL=https://docs.google.com/forms/d/e/YOUR_ID/formResponse
   VITE_WAITLIST_EMAIL_FIELD=entry.1234567890
   ```
4. Commit and push — responses arrive in the Form's Responses tab.
