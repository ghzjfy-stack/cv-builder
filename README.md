# QuickCV

Hebrew-first résumé builder: live studio, ATS-friendly templates, PDF export, and paid unlock (Bit / PayBox). Live site: [quickcv.app](https://quickcv.app).

The editor is a Vite SPA (`index.html` + `src/`). Category landing pages are a Next.js static export merged into the same `dist/` output for SEO.

## Features

- Live preview with Hebrew (RTL) and English (LTR)
- Template skins and role-based presets (sales, hi-tech, students, CS, marketing, education, and more)
- Optional cover letter in the export pack
- High-res / selectable PDF (html2canvas, jsPDF, html2pdf.js)
- Checkout packs (basic ~₪9.90, complete ~₪19.90) with access codes
- WhatsApp / email delivery of the PDF after payment
- Telegram order alerts + admin control bot (`/code`, `/status`, `/revoke`)

## Stack

| Piece | Role |
| --- | --- |
| Vite 7 | Studio SPA, local API plugin |
| Next.js 14 (`output: "export"`) | `/templates/` SEO pages, sitemap, robots |
| Vercel | Hosting + serverless `api/*.js` |
| TypeScript | Typed modules compiled / typechecked; much of the studio is still JS |

## Local setup

```bash
npm install
cp .env.example .env
```

Fill `.env` as needed. For studio-only UI work, most payment keys can stay empty.

**Studio (Vite), default http://localhost:5173**

```bash
npm run dev
```

Vite proxies payment routes through `server/vitePlugin.js`.

**SEO pages (Next), http://localhost:3000**

```bash
npm run dev:seo
```

**APIs only (no Vite), default http://localhost:8787**

```bash
npm run start:api
```

**Production build** (typecheck → Next export → Vite build → merge SEO into `dist/`)

```bash
npm run build
npm run preview   # Vite preview of dist, http://localhost:4173
```

Deploy: Vercel uses `vercel.json` (`buildCommand: npm run build`, `outputDirectory: dist`). Set the same env vars in the Vercel project. Production unlock codes need Vercel KV / Upstash Redis (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) so they survive cold starts.

## Environment

See `.env.example`. Groups:

- **Bit screenshot verify:** `OPENAI_API_KEY` (vision)
- **Payments:** `PAYMENT_TOKEN_SECRET`, webhook secrets, optional `PAYBOX_*` URLs and public key
- **Prices:** `PAYMENT_AMOUNT_ILS`, `PAYMENT_PACK_COMPLETE_ILS`, `COVER_LETTER_BUMP_ILS`
- **Codes:** `CODE_TTL_SECONDS` (default 30 days), KV / Redis
- **Notify / send:** WhatsApp Cloud API, Resend, Telegram
- **Telegram admin:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, optional `TELEGRAM_ADMIN_IDS`, `TELEGRAM_WEBHOOK_SECRET`
- **Public URL:** `NEXT_PUBLIC_SITE_URL` (canonical / Open Graph)

Never commit `.env`. Checkout display numbers and Bit/PayBox URLs also live in `src/config/checkout.ts`.

## Telegram control panel

After deploy, point the bot webhook at your site:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://quickcv.app/api/telegram-webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Commands (admin chat only): `/help`, `/status`, `/code`, `/lookup`, `/revoke`.

## Layout

```
index.html          Studio shell (RTL marketing + editor)
src/                Access gate, checkout, PDF export
lib/                Templates, draft, cover letter, export helpers
app/                Next SEO: /templates and /templates/[category]
api/                Vercel serverless wrappers
server/             Shared HTTP handlers (used by Vite plugin, Node server, and api/)
scripts/merge-seo.mjs   Copies Next `out/` into Vite `dist/`
```

Studio entry: `src/main.ts`. Template data: `lib/templates.js`. Category copy: `app/lib/categories.ts`.

## License

Private (`"private": true` in `package.json`). Not published as an npm package.
