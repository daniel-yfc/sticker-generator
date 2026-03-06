import { StyleOption } from "../types";
import { logger } from "../utils/logger";
import { stickerGenerationLimiter } from "../utils/rateLimit";
import { sanitizeErrorMessage } from "../utils/validation";

const BATCH_CONCURRENCY = 2;

/**
 * Generates a sticker from an image using the backend API
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
  // Rate limiting check
  const rateLimitResult = stickerGenerationLimiter.check('generate');
  if (!rateLimitResult.allowed) {
    const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} seconds before generating more stickers.`
    );
  }

  try {
    const response = await fetch('/api/generate-sticker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        style,
        variationPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'error_process');
    }

    if (!data.image) {
      throw new Error('error_no_image');
    }

    logger.info('Sticker generated successfully via backend');
    return data.image;

  } catch (error: unknown) {
    logger.error("Backend API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "error_process";
    const sanitizedMessage = sanitizeErrorMessage(errorMessage);
    
    throw new Error(sanitizedMessage);
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
  logger.info(`Generating sticker set with ${variations.length} variations via backend`);
  
  return throttledMap(
    variations, 
    (v) => generateSticker(sourceImageBase64, style, v), 
    BATCH_CONCURRENCY
  );
};
