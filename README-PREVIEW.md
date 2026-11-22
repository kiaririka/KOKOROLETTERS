# Kokoro Letters: free GitHub Pages preview

The preview keeps every interactive page (map, unlocking animations, journal, FAQ,
checkout flow). Only the server calls are answered inside the browser
(`src/previewApi.ts`). No real payments, emails or accounts exist in this build.

## Put it live
1. Create a GitHub repo and push this folder to the `main` branch.
2. Repo Settings > Pages > Source: **GitHub Actions**.
3. Push again (or run the workflow from the Actions tab). Your link appears in the run.

Test locally first: `npm install` then `npm run build:preview` then `npx vite preview --outDir dist-preview`.

## Make the waitlist real (Google Form)
1. Make a Google Form with one short-answer question: Email.
2. Form menu (three dots) > **Get pre-filled link**, type any text, click Get link, copy it.
   In that link, `entry.123456789=...` is your field id.
3. Take the form's normal link, change the end `/viewform` to `/formResponse`.
4. Put both values in `.env.preview` (remove the `#`), commit and push.
Replies then arrive in the form's Responses tab.

## Still true: this is not the production app
The real app (server.ts) must NOT be deployed until the security items are fixed:
open Firestore rules, forgeable session cookie, unprotected admin/debug endpoints,
simulated payments, unsigned webhooks.
