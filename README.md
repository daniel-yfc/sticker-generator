<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sticker Maker Pro

[繁體中文版說明 (Traditional Chinese)](README_zh.md)

Sticker Maker Pro is an AI-powered sticker generator web application. It transforms your portrait photos into high-quality, stylized stickers using the Google Gemini API (`gemini-2.5-flash-image`). Choose from 12 distinct art styles, easily edit and crop your photos, and generate a cohesive set of stickers with varying expressions.

## Features

- **12 Distinct Art Styles:** Modern Vector, Analog Marker, Ligne Claire, Retro Risograph, 3D Stylized, Artistic Watercolor, Tech Industrial, Dynamic Comic, Colored Pencil, Rubber Hose, Dark Film Noir, and Impasto Oil.
- **Photo Upload & Editing:** Upload portraits (JPG/PNG, max 10 MB). An intuitive image editor supports zoom, pan, and rotation.
- **AI Background Removal & Stylization:** The Gemini API removes the background, isolates the subject, and applies the selected style with a clean white die-cut border.
- **Sticker Set Generation:** Generate a set of 4 stickers from a single photo — same style, varied expressions (e.g., thumbs up, laughing, surprised, cool).
- **Local History & Gallery:** Created stickers are saved to browser history (Collection). A curated Sample Gallery is included for inspiration.
- **Multi-language Support:** UI available in English, Traditional Chinese (`zh-TW`), and Japanese (`ja`).
- **CAPTCHA Protection:** Cloudflare Turnstile integration guards the generation endpoint.

## Specs & Limitations

- **Max File Size:** 10 MB per upload.
- **Supported Formats:** JPG, PNG (clear portrait recommended).
- **Output:** PNG images, suitable for download.
- **Rate Limiting:** Server-side per-IP rate limiting via `stickerGenerationLimiter`. Set generation uses a throttled map with concurrency limit of 2.
- **Daily Quota:** In-memory daily quota (resets at midnight UTC). Configurable via `DAILY_QUOTA_LIMIT`.
- **Timeouts:** UI times out at 70 s; backend enforces a strict 60 s API call timeout.
- **Safety Filters:** If the Gemini API triggers a safety block, the user is prompted to upload a different image.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [React 19](https://react.dev/) |
| Build tool | [Vite 6](https://vitejs.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| AI | `@google/genai` — model `gemini-2.5-flash-image` |
| Icons | [Lucide React](https://lucide.dev/) |
| Unit tests | [Vitest](https://vitest.dev/) + React Testing Library + jsdom |
| E2E / UI | [Playwright](https://playwright.dev/) |
| CAPTCHA | [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) |

## Architecture

The app uses a **backend proxy** pattern to keep the Gemini API key out of the browser:

```
Browser (React/Vite)
      │  HTTP POST /api/generate
      ▼
Node.js backend (server.cjs)
  • validates request & CAPTCHA token
  • constructs server-side prompt
  • enforces rate limits & daily quota
      │
      ▼
Google Gemini API
```

- **Frontend** — `index.tsx` → `App.tsx` → `components/` (FileUpload, ImageEditor, StyleSelector, StickerSetView, ResultDisplay, StickerHistory, Gallery, Header, TurnstileWidget, ProcessingView)
- **Backend** — `server.cjs` (Express-based Node.js proxy; also serves the compiled SPA in production)
- **Services / Hooks / Utils** — shared logic in `services/`, `hooks/`, `utils/`

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) **v20+** (matches the Docker runtime)
- npm (bundled with Node.js)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/daniel-yfc/sticker-generator.git
   cd sticker-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here

   # Port the backend proxy listens on (default: 3001)
   BACKEND_PORT=3001

   # Origin(s) the frontend is served from — used for CORS
   # Comma-separate multiple: http://localhost:5173,https://myapp.com
   FRONTEND_ORIGIN=http://localhost:5173

   # Set to 'false' to disable all generation (kill switch)
   GENERATION_ENABLED=true

   # In-memory daily quota (resets at midnight UTC)
   DAILY_QUOTA_LIMIT=200

   # Cloudflare Turnstile (server-side secret + frontend site key)
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   # For local dev without CAPTCHA, use the always-pass test key:
   VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
   ```

4. **Start development servers (frontend + backend concurrently):**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173` (Vite default)
   - Backend proxy: `http://localhost:3001`

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start frontend **and** backend concurrently |
| `npm run dev:frontend` | Start Vite dev server only |
| `npm run dev:backend` | Start Node.js proxy server only |
| `npm run build` | Build the SPA for production (`dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest unit test suite |
| `npm run typecheck` | TypeScript type-check without emitting files |

## Docker

A multi-stage `Dockerfile` is included. The final image runs `server.cjs`, which serves both the compiled SPA and the `/api/*` proxy.

### Build

```bash
docker build \
  --build-arg VITE_API_BASE_URL='' \
  -t sticker-maker-pro .
```

> `VITE_API_BASE_URL` is a build-time Vite variable. Leave it empty when the frontend and backend share the same origin (default).

### Run

```bash
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key_here \
  -e FRONTEND_ORIGIN=http://localhost:3001 \
  -e GENERATION_ENABLED=true \
  -e DAILY_QUOTA_LIMIT=200 \
  sticker-maker-pro
```

Secrets (`GEMINI_API_KEY`, `TURNSTILE_SECRET_KEY`) are injected at runtime — never baked into the image.

The app is served at `http://localhost:3001`.
