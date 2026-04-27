import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleOption } from "../types";
import { logger } from "../utils/logger";
import { stickerGenerationLimiter } from "../utils/rateLimit";
import { sanitizeErrorMessage } from "../utils/validation";

// Performance and security constants
const API_TIMEOUT_MS = 60000; // 60 seconds
const MAX_RETRIES = 1;
const BATCH_CONCURRENCY = 2;

/**
 * Validates API key at runtime
 * Provides clear error messaging for missing configuration
 * 
 * @throws Error if API key is missing or invalid
 */
function validateApiKey(): string {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    logger.error('API Key validation failed');
    throw new Error('API Key is missing. Please check your configuration.');
  }
  
  return apiKey;
}

/**
 * Validates base64 image data format
 * Prevents invalid data from being sent to API
 * 
 * @param imageBase64 - Base64 encoded image string
 * @returns Validated MIME type and base64 data
 */
function validateAndExtractImageData(imageBase64: string): { mimeType: string; base64Data: string } {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('Invalid image data');
  }

  // Extract MIME type and base64 data
  const mimeMatch = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // For unsupported MIME types or invalid formats, attempt generic extraction
  let base64Data = imageBase64;
  if (imageBase64.startsWith("data:")) {
    const commaIndex = imageBase64.indexOf(",");
    if (commaIndex !== -1) {
      base64Data = imageBase64.slice(commaIndex + 1);
    }
  }

  // Validate base64 data exists and looks valid
  if (!base64Data || base64Data.length < 100) {
    throw new Error('Invalid or corrupted image data');
  }

  // Basic base64 format validation
  if (!/^[A-Za-z0-9+/]+=*$/.test(base64Data.substring(0, 100))) {
    throw new Error('Invalid base64 format');
  }

  return { mimeType, base64Data };
}

/**
 * Helper to race a promise against a timeout
 * Prevents indefinite hanging on API calls
 * 
 * @param promise - Promise to execute
 * @param ms - Timeout in milliseconds
 * @param message - Error message for timeout
 * @returns Promise that resolves with result or rejects on timeout
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
};



/**
 * Checks if sticker generation is allowed by rate limit
 * @throws Error if rate limit is exceeded
 */
function checkRateLimit(): void {
  const rateLimitResult = stickerGenerationLimiter.check('generate');
  if (!rateLimitResult.allowed) {
    const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} seconds before generating more stickers.`
    );
  }
}


/**
 * Builds the text prompt for the sticker generation API
 * @param style - Style configuration for the sticker
 * @param variationPrompt - Optional prompt for variation
 * @returns The final constructed prompt
 */
function buildStickerPrompt(style: StyleOption, variationPrompt?: string): string {
  // Improved Prompt Engineering
  // Focus on "Transformation" and "Artistic Medium" to avoid photorealism
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

  return basePrompt + extraInstruction;
}


/**
 * Validates the API response and extracts the base64 image data
 * @param response - The API response object
 * @returns Base64 encoded PNG image
 * @throws Error for various failure conditions
 */
function extractImageFromResponse(response: GenerateContentResponse): string {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("error_safety");
  }

  const candidate = response.candidates[0];

  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    logger.error("Gemini Generation Failed. Finish Reason:", candidate.finishReason);
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
      logger.info('Sticker generated successfully');
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("error_no_image");
}

/**
 * Handles and formats Gemini API errors
 * @param error - The error thrown during API call
 * @throws A formatted and sanitized Error
 */
function handleGeminiError(error: unknown): never {
  logger.error("Gemini API Error:", error);

  const errorMessage = error instanceof Error ? error.message : "error_process";
  const sanitizedMessage = sanitizeErrorMessage(errorMessage);

  throw new Error(sanitizedMessage);
}

/**
 * Generates a sticker from an image using Gemini AI
 * Includes rate limiting, validation, and comprehensive error handling
 * 
 * @param imageBase64 - Base64 encoded image string
 * @param style - Style configuration for the sticker
 * @param variationPrompt - Optional prompt for variation (e.g., "smiling", "waving")
 * @returns Promise resolving to base64 encoded PNG image
 * @throws Error with sanitized message if generation fails
 */
export const generateSticker = async (
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string
): Promise<string> => {
  checkRateLimit();

  // Validate API key
  const apiKey = validateApiKey();
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Validate and extract image data
    const { mimeType, base64Data } = validateAndExtractImageData(imageBase64);
    
    const finalPrompt = buildStickerPrompt(style, variationPrompt);

    logger.info('Generating sticker with style:', style.id);

    const response: GenerateContentResponse = await withTimeout(
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

    return extractImageFromResponse(response);

  } catch (error: unknown) {
    handleGeminiError(error);
  }
};

/**
 * Throttled parallel execution utility
 * Limits concurrent operations to prevent overwhelming the API
 * 
 * @param items - Array of items to process
 * @param fn - Async function to execute for each item
 * @param concurrencyLimit - Maximum number of concurrent operations
 * @returns Promise resolving to array of results
 */
export const throttledMap = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrencyLimit: number = BATCH_CONCURRENCY
): Promise<R[]> => {
  const results: Promise<R>[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);

    if (concurrencyLimit <= items.length) {
      const e: Promise<void> = p.then(() => {
        executing.delete(e);
      }).catch(() => {
        executing.delete(e);
      });
      executing.add(e);
      
      if (executing.size >= concurrencyLimit) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(results);
};

/**
 * Generates a set of sticker variations from a single source image
 * Uses throttling to manage API rate limits and prevent abuse
 * 
 * @param sourceImageBase64 - Base64 encoded source image
 * @param style - Style configuration for stickers
 * @param variations - Array of variation prompts
 * @returns Promise resolving to array of base64 encoded PNG images
 */
export const generateStickerSet = async (
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[]
): Promise<string[]> => {
  logger.info(`Generating sticker set with ${variations.length} variations`);
  
  return throttledMap(
    variations, 
    (v) => generateSticker(sourceImageBase64, style, v), 
    BATCH_CONCURRENCY
  );
};
