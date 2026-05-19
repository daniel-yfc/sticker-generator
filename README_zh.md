<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sticker Maker Pro（AI 貼圖製作工具）

[English Version](README.md)

Sticker Maker Pro 是一個由 AI 驅動的貼圖生成 Web 應用程式。它使用 Google Gemini API（`gemini-2.5-flash-image`）將您的人物肖像照片轉換為高品質、風格化的貼圖。可從 12 種獨特的藝術風格中選擇，輕鬆編輯和裁切照片，並生成一組表情豐富的套裝貼圖。

## 核心功能

- **12 種藝術風格：** 專業向量平塗風、酒精麥克筆手繪、極簡清亮風格、復古藝術孔版風、3D 擬真卡通風、傳統水彩暈染風、賽博機械核心風、美式硬派漫畫風、精細色鉛筆素描、30 年代橡膠管風、罪惡之城黑白漫、藝術厚塗油畫風。
- **照片上傳與編輯：** 支援 JPG/PNG 上傳（最大 10 MB）。內建編輯器支援縮放、平移與旋轉。
- **AI 風格化：** Gemini API 智慧移除背景、應用所選風格，並加上乾淨的白色切割邊框。
- **擴展套裝貼圖生成：** 從單張照片生成 4 張貼圖，風格一致但表情動作不同（舉大拇指、大笑、驚訝、帥氣冷靜）。
- **本機貼圖集與藝廊：** 貼圖自動儲存至瀏覽器本機。內含精選示範藝廊。
- **多語言 UI：** 英文、繁體中文（`zh-TW`）及日文（`ja`）。

## 規格限制

- **檔案大小上限：** 每次上傳 10 MB。
- **支援格式：** JPG、PNG。
- **輸出格式：** PNG 圖片。
- **速率限制：** 伺服器端依 IP 限制請求頻率。套裝生成使用並發限制（上限 2）。
- **超時設定：** 前端 UI 超時 70 秒；後端 Gemini 呼叫超時 20 秒，最多重試 2 次。
- **安全過濾：** 被封鎖的內容會回傳錯誤，提示使用者更換圖片。

## 技術堆疊

| 層級 | 技術 |
|---|---|
| 前端 | React 19、Vite 6、TypeScript 5、Tailwind CSS 4 |
| AI | `@google/genai` — `gemini-2.5-flash-image` |
| 後端代理 | Node.js（`server.cjs`，CJS，無框架） |
| 圖示庫 | Lucide React |
| 單元測試 | Vitest、React Testing Library、jsdom |
| E2E | Playwright |

## 應用程式架構

本應用程式採用**後端代理**模式：

1. Vite/React 前端將圖片與風格請求發送至本機 Node.js 後端（`server.cjs`）。
2. 後端驗證請求、在伺服器端建構提示詞（`server/promptBuilder.cjs`），再呼叫 Gemini API。
3. Gemini API 金鑰不會暴露於瀏覽器端。

## 本機開發設定

### 系統需求

- [Node.js](https://nodejs.org/) v18+
- npm
- Google Gemini API 金鑰

### 步驟

1. **複製並安裝：**
   ```bash
   git clone <repository-url>
   cd sticker-maker-pro
   npm install
   ```

2. **建立 `.env.local`**（於專案根目錄）：
   ```env
   # 必填
   GEMINI_API_KEY=your_gemini_api_key_here

   # 伺服器設定
   BACKEND_PORT=3001
   FRONTEND_ORIGIN=http://localhost:3000
   GENERATION_ENABLED=true

   # Cloudflare Turnstile（人機驗證）
   TURNSTILE_SECRET_KEY=your_turnstile_secret_key
   VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key

   # 可選：配額與速率限制調整
   DAILY_QUOTA_LIMIT=200
   RATE_LIMIT_PER_IP=5
   RATE_LIMIT_WINDOW_MS=60000
   CAPTCHA_TOKEN_TTL_MS=300000
   ```

3. **啟動開發伺服器：**
   ```bash
   npm run dev
   ```
   此指令會同時啟動 **Node.js 後端代理**與 **Vite 前端**。
   前端：`http://localhost:3000` · 後端：`http://localhost:3001`

### 可用 Scripts

| 指令 | 說明 |
|---|---|
| `npm run dev` | 同時啟動後端與前端 |
| `npm run dev:backend` | 僅啟動 Node.js 後端（`server.cjs`） |
| `npm run dev:frontend` | 僅啟動 Vite 前端 |
| `npm run build` | 建置生產環境版本 |
| `npm run preview` | 在本機預覽生產環境建置 |
| `npm run test` | 執行 Vitest 測試套件 |

> **TypeScript 型別檢查：** 預設建置腳本未包含型別檢查。請手動執行 `npx tsc --noEmit` 來驗證型別。
