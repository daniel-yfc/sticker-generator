<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sticker Maker Pro

[繁體中文版說明 (Traditional Chinese)](README_zh.md)

Sticker Maker Pro is an AI-powered sticker generator web application. It transforms your portrait photos into high-quality, stylized stickers using the Google Gemini API (`gemini-2.5-flash-image`). Choose from 12 distinct art styles, easily edit and crop your photos, and even generate a cohesive set of stickers with varying expressions!

View your app in AI Studio (if applicable): https://ai.studio/apps/5dd86bf7-d123-47b4-ae37-3b5408e2930d

## Features & Functions

*   **12 Distinct Art Styles:** Choose from a wide variety of styles including Modern Vector, Analog Marker, Ligne Claire, Retro Risograph, 3D Stylized, Artistic Watercolor, Tech Industrial, Dynamic Comic, Colored Pencil, Rubber Hose, Dark Film Noir, and Impasto Oil.
*   **Photo Upload & Editing:** Upload your favorite portraits (JPG/PNG). Features an intuitive image editor allowing zoom, pan, and rotation to frame your subject perfectly. Max file size: 10MB.
*   **AI Background Removal & Stylization:** The app leverages the Gemini API to intelligently remove backgrounds, isolate the subject, and apply the selected artistic style with a clean white die-cut border.
*   **Sticker Set Generation:** Generate an expanded set of 3 stickers from a single photo, keeping the style consistent but varying the expressions (e.g., thumbs up, laughing, surprised).
*   **Local History & Gallery:** Automatically saves your created stickers to your local browser history (Collection). Browse a curated Sample Gallery to get inspired.
*   **Multi-language Support:** UI available in English, Traditional Chinese (`zh-TW`), and Japanese (`ja`).

## Specs & Limitations

*   **Max File Size:** 10MB per upload.
*   **Supported Formats:** JPG, PNG (Clear portrait recommended).
*   **Resolution:** Generated stickers are output as 512x512px PNG images.
*   **API Rate Limiting:** The app implements a custom rate limiter (`stickerGenerationLimiter`) to prevent API abuse. Sticker set generation uses a throttled map with a concurrency limit of 2 to avoid overwhelming the Gemini API.
*   **Processing Timeout:** The UI will timeout if a response from the API takes longer than 70 seconds. The backend API call has a strict 60-second timeout.
*   **Safety Filters:** The app handles API safety block responses and alerts the user to upload a different image if safety filters are triggered.

## Tech Stack

*   **Frontend Framework:** [React 19](https://react.dev/)
*   **Build Tool:** [Vite 6](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
*   **Language:** [TypeScript 5](https://www.typescriptlang.org/)
*   **AI Integration:** `@google/genai` (Google Gemini API - Model: `gemini-2.5-flash-image`)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Testing:** [Vitest](https://vitest.dev/), React Testing Library, jsdom
*   **E2E / UI Verification:** [Playwright](https://playwright.dev/)

## User Build Must-Know (Local Setup)

To run this application locally, you will need Node.js installed on your machine and a valid Google Gemini API key.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 18+ recommended)
*   npm (comes with Node.js)
*   A Google Gemini API Key

### Installation & Setup

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd sticker-maker-pro
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables (`.env.local`):**
    You must provide your Gemini API key for the application to function.
    Create a `.env.local` file in the root directory of the project:
    ```bash
    touch .env.local
    ```
    Add your API key to the file:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
    *(Note: The `vite.config.ts` maps `GEMINI_API_KEY` to `process.env.API_KEY` which is used by the application).*

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The application will typically start on `http://localhost:3000` (or `http://0.0.0.0:3000`).

### Available Scripts

*   `npm run dev` - Starts the Vite development server.
*   `npm run build` - Builds the application for production.
*   `npm run preview` - Previews the production build locally.
*   `npm run test` - Runs the Vitest test suite.
*   *(Note: Type checking is not included in the default build script. Run `npx tsc --noEmit` to validate TypeScript types manually).*
