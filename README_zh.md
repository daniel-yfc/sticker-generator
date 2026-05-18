<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sticker Maker Pro (AI 貼圖製作工具)

[English Version (英文版)](README.md)

Sticker Maker Pro 是一個由 AI 驅動的貼圖生成 Web 應用程式。它使用 Google Gemini API (`gemini-2.5-flash-image`) 將您的人物肖像照片轉換為高品質、風格化的貼圖。您可以從 12 種獨特的藝術風格中選擇，輕鬆編輯和裁切您的照片，甚至可以生成一組表情豐富的套裝貼圖！

若適用，可在 AI Studio 中預覽：https://ai.studio/apps/5dd86bf7-d123-47b4-ae37-3b5408e2930d

## 核心功能與特色

*   **12 種獨特風格：** 包括專業向量平塗風、酒精麥克筆手繪、極簡清亮風格、復古藝術孔版風、3D 擬真卡通風、傳統水彩暈染風、賽博機械核心風、美式硬派漫畫風、精細色鉛筆素描、30年代橡膠管風、罪惡之城黑白漫、藝術厚塗油畫風。
*   **照片上傳與編輯：** 支援 JPG/PNG 照片上傳（建議清晰肖像）。內建直覺的影像編輯器，允許縮放、平移和旋轉，讓您的拍攝主體完美置中。檔案大小限制：10MB。
*   **AI 智慧去背與風格化：** 應用程式利用 Gemini API 智慧移除背景、分離主體，並套用所選的藝術風格，加上乾淨的白色切割邊框。
*   **擴展套裝貼圖生成：** 能夠從單張照片生成一組 **4 張**擴充貼圖，保持風格一致但展現不同表情動作（例如：豎起大拇指、大笑、驚訝、帥氣冷靜）。
*   **本機圖庫與貼圖集：** 自動將您創建的貼圖儲存至瀏覽器本機的「我的貼圖集」中。您也可以瀏覽精選的示範範例來獲取靈感。
*   **多語言支援：** 使用者介面支援英文、繁體中文 (`zh-TW`) 及日文 (`ja`)。

## 規格限制與特性

*   **檔案大小上限：** 每次上傳 10MB。
*   **支援格式：** JPG、PNG。
*   **輸出格式：** 生成的貼圖以 PNG 格式輸出，適合直接下載使用。
*   **API 速率限制：** 應用程式內建自訂速率限制器 (`stickerGenerationLimiter`) 以防止 API 濫用。套裝貼圖生成採用節流機制（併發限制為 2），避免對 Gemini API 造成過大負載。
*   **處理超時：** 如果 API 回應時間超過 70 秒，前端介面會提示逾時。後端 API 呼叫本身則有嚴格的 60 秒超時設定。
*   **安全過濾機制：** 應用程式能處理 API 的安全阻擋回應，若內容觸發安全過濾，將提示使用者更換圖片。

## 技術堆疊

*   **前端框架：** [React 19](https://react.dev/)
*   **建置工具：** [Vite 6](https://vitejs.dev/)
*   **樣式與排版：** [Tailwind CSS 4](https://tailwindcss.com/)
*   **開發語言：** [TypeScript 5](https://www.typescriptlang.org/)
*   **AI 整合服務：** `@google/genai` (Google Gemini API - 模型：`gemini-2.5-flash-image`)
*   **圖示庫：** [Lucide React](https://lucide.dev/)
*   **單元測試：** [Vitest](https://vitest.dev/)、React Testing Library、jsdom
*   **UI 自動化驗證：** [Playwright](https://playwright.dev/)

## 開發者建置指南 (本機環境設定)

要在本機運行此應用程式，您的電腦需要安裝 Node.js，並擁有有效的 Google Gemini API 金鑰。

### 應用程式架構

本應用程式採用**後端代理**模式：
- 前端（Vite/React）將圖片與風格請求發送至本機 Node.js 後端（`server.cjs`）。
- 後端驗證請求、在伺服器端建構提示詞（prompt），再呼叫 **Google Gemini API**。
- Gemini API 金鑰不會暴露於瀏覽器端。

### 系統需求

*   [Node.js](https://nodejs.org/) (建議使用版本 18 或以上)
*   npm (隨 Node.js 一同安裝)
*   Google Gemini API 金鑰

### 安裝與啟動步驟

1.  **複製程式碼儲存庫**（如果您尚未取得）：
    ```bash
    git clone <repository-url>
    cd sticker-maker-pro
    ```

2.  **安裝依賴套件：**
    ```bash
    npm install
    ```

3.  **設定環境變數 (`.env.local`)：**
    請在專案的根目錄中建立一個 `.env.local` 檔案：
    ```bash
    touch .env.local
    ```
    依需求加入以下環境變數：
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

4.  **啟動開發伺服器：**
    ```bash
    npm run dev
    ```
    應用程式通常會在 `http://localhost:3000`（或 `http://0.0.0.0:3000`）啟動。

### 可用的 Scripts 指令

*   `npm run dev` - 啟動 Vite 開發伺服器。
*   `npm run build` - 建置用於生產環境的應用程式。
*   `npm run preview` - 在本機預覽生產環境的建置結果。
*   `npm run test` - 執行 Vitest 測試套件。
*   *(備註：預設的建置腳本未包含 TypeScript 型別檢查。請手動執行 `npx tsc --noEmit` 來驗證型別)。*
