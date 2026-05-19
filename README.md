<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sticker Maker Pro

[繁體中文版說明 (Traditional Chinese)](README_zh.md)

Sticker Maker Pro is an AI-powered sticker generator web application. It transforms your portrait photos into high-quality, stylized stickers using the Google Gemini API (`gemini-2.5-flash-image`). Choose from 12 distinct art styles, easily edit and crop your photos, and generate a cohesive set of stickers with varying expressions.

## Features

- **12 Art Styles:** Flat Vector Art, Marker Illustration, Minimalist Flat Design, Risograph Print, 3D Stylized Render, Watercolor Illustration, Cyberpunk Mecha, American Comic Art, Colored Pencil Sketch, 1930s Animation, Noir Graphic Novel, Impasto Oil Painting.
- **Photo Upload & Editing:** Upload JPG/PNG portraits (max 10 MB). Built-in editor supports zoom, pan, and rotation.
- **AI Stylization:** Gemini API removes the background, applies the selected style, and adds a white die-cut border.
- **Sticker Set Generation:** Generate 4 stickers from one photo — same style, different expressions (thumbs up, laughing, surprised, cool).
- **Local Collection & Gallery:** Stickers are saved to browser local storage. A curated sample gallery is included.
- **Multi-language UI:** English, Traditional Chinese (`zh-TW`), and Japanese (`ja`).

## Specs & Limitations

- **Max file size:** 10 MB per upload.
- **Supported formats:** JPG, PNG.
- **Output:** PNG images.
- **Rate limiting:** Per-IP request limit enforced server-side. Set generation uses concurrency limit of 2.
- **Timeouts:** Frontend UI timeout 70 s; backend Gemini call timeout 20 s with up to 2 retries.
- **Safety filters:** Blocked content returns an error prompting the user to try a different image.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript 5, Tailwind CSS 4 |
| AI | `@google/genai` — `gemini-2.5-flash-image` |
| Backend proxy | Node.js (`server.cjs`, CJS, no framework) |
| Icons | Lucide React |
| Unit tests | Vitest, React Testing Library, jsdom |
| E2E | Playwright |

## Architecture

This app uses a **backend proxy** pattern:

1. The Vite/React frontend sends image + style requests to the local Node.js backend (`server.cjs`).
2. The backend validates the request, constructs the prompt server-side (`server/promptBuilder.cjs`), and calls the Gemini API.
3. The Gemini API key is never exposed to the browser.

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm
- A Google Gemini API key

### Steps

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd sticker-maker-pro
   npm install
   ```

2. **Create `.env.local`** in the project root:
   ```env
   # Required
   GEMINI_API_KEY=your_gemini_api_key_here

   # Server
   BACKEND_PORT=3001
   FRONTEND_ORIGIN=http://localhost:3000
   GENERATION_ENABLED=true

   # Cloudflare Turnstile (CAPTCHA)
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key

   # Optional overrides
   DAILY_QUOTA_LIMIT=200
   RATE_LIMIT_PER_IP=5
   RATE_LIMIT_WINDOW_MS=60000
   CAPTCHA_TOKEN_TTL_MS=300000
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```
   Starts the Node.js backend proxy **and** the Vite frontend in parallel.
   Frontend: `http://localhost:3000` · Backend: `http://localhost:3001`

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start backend + frontend in parallel |
| `npm run dev:backend` | Start Node.js backend only (`server.cjs`) |
| `npm run dev:frontend` | Start Vite frontend only |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest test suite |

> **Type checking:** not included in the build script. Run `npx tsc --noEmit` manually.
