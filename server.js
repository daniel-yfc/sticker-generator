import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const port = process.env.PORT || 3001;

// Increase JSON body limit for large base64 images
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Performance and security constants
const API_TIMEOUT_MS = 60000; // 60 seconds

function validateAndExtractImageData(imageBase64) {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Invalid image data');
  }

  const mimeMatch = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  let base64Data = imageBase64.replace(/^data:image\/(?:png|jpeg|jpg|webp);base64,/, "");
  if (base64Data === imageBase64 && imageBase64.startsWith("data:")) {
    base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
  }

  if (!base64Data || base64Data.length < 100) {
    throw new Error('Invalid or corrupted image data');
  }

  if (!/^[A-Za-z0-9+/]+=*$/.test(base64Data.substring(0, 100))) {
    throw new Error('Invalid base64 format');
  }

  return { mimeType, base64Data };
}

const withTimeout = (promise, ms, message) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
};

// In-memory rate limiting mechanism (basic example)
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 10000; // 10 seconds between requests per IP

function checkRateLimit(ip) {
  const lastReq = rateLimitMap.get(ip);
  const now = Date.now();
  if (lastReq && now - lastReq < RATE_LIMIT_MS) {
    return { allowed: false, waitTime: Math.ceil((RATE_LIMIT_MS - (now - lastReq)) / 1000) };
  }
  rateLimitMap.set(ip, now);
  return { allowed: true };
}

app.post('/api/generate-sticker', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: `Rate limit exceeded. Please wait ${rateLimit.waitTime} seconds before generating more stickers.` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key is missing. Please check your configuration.' });
    }

    const { imageBase64, style, variationPrompt } = req.body;

    if (!imageBase64 || !style) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const { mimeType, base64Data } = validateAndExtractImageData(imageBase64);

    const styleDescription = `${style.basePrompt} ${style.modifiers.person}`;

    const basePrompt = `Generate a high-quality die-cut sticker of the person in the provided image.

    ART STYLE: ${styleDescription}.

    CRITICAL INSTRUCTIONS:
    1. TRANSFORM the subject into a stylistic illustration matching the Art Style.
    2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.
    3. SIMPLIFY details to match the sticker aesthetic.
    4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).
    5. Use a solid white background.
    `;

    const extraInstruction = variationPrompt
      ? `\nExpression/Action Variation: ${variationPrompt}. Ensure the style remains consistent.`
      : `\nExpression: Expressive and charismatic.`;

    const finalPrompt = basePrompt + extraInstruction;

    const ai = new GoogleGenAI({ apiKey });

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: finalPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      }),
      API_TIMEOUT_MS,
      "error_timeout"
    );

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("error_safety");
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("error_safety");
      }
      throw new Error(`error_process`);
    }

    const parts = candidate.content?.parts;

    if (!parts) {
      throw new Error("error_no_image");
    }

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return res.json({ image: `data:image/png;base64,${part.inlineData.data}` });
      }
    }

    throw new Error("error_no_image");

  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "error_process";
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
