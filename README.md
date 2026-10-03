# FitLife Gym Management frontend

React + Vite frontend for the existing Spring Boot gym-management backend.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). Keep the backend running on port 8080 for real sign-in, member, trainer, and payment operations. The existing API configuration is unchanged.

```bash
npm run build
npm run preview
```

## Visual refresh

- `src/components/LandingPage.jsx`: responsive club website, mobile navigation, and links into the existing membership/sign-in flow.
- `src/components/LoginPage.jsx`: responsive sign-in, password visibility, and account-help feedback using the existing authentication service.
- `src/visual-refresh.css`: public website/sign-in styling and shared colors.
- `src/dashboard-refresh.css`: scoped workspace, profile, table, and modal styling. Load it after the original styles.

Membership cards still use the existing API and fallback plans. Website photography is served locally; no image-host requests are required at runtime. The existing Google Fonts import remains, with system-font fallbacks.

## Browser smoke checks

`scripts/ui-smoke.mjs` checks desktop/mobile layouts (320–1440px), navigation, keyboard method selection, membership loading/fallbacks, sign-in errors/password visibility, owner/member/trainer screens, member search/forms, and sign-out. All API requests use synthetic fixtures; this does **not** verify a live backend or payment processing.

With Playwright and Chromium available, start `npm run preview -- --host 127.0.0.1 --port 4173`, then run:

```bash
node scripts/ui-smoke.mjs
```

To keep test tools outside the application dependencies:

```bash
npm install --prefix /tmp/fitlife-ui-tools playwright
/tmp/fitlife-ui-tools/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/fitlife-ui-tools/node_modules/playwright/index.mjs node scripts/ui-smoke.mjs
```

`UI_BASE_URL` overrides the server URL; `UI_ARTIFACT_DIR` overrides the screenshot directory (default `/tmp/fitlife-ui-artifacts`). Chromium also needs the appropriate operating-system libraries. The project does not currently define lint or typecheck scripts.

## Photo sources

Illustrative fitness photography downloaded from Unsplash:

- `public/images/fitlife-gym.jpg`: https://images.unsplash.com/photo-1534438327276-14e5300c3a48
- `public/images/fitlife-training.jpg`: https://images.unsplash.com/photo-1517836357463-d25dfeac3438

License: https://unsplash.com/license. Replace these illustrative images with your own gym photography when available.
