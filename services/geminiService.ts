import { logger } from "../utils/logger";
import { stickerGenerationLimiter } from "../utils/rateLimit";
import { VariationId } from "../utils/promptBuilder";

const API_TIMEOUT_MS = 60000;
const BATCH_CONCURRENCY = 2;

interface GeminiResponsePart {
  inlineData?: { data: string; mimeType?: string };
  text?: string;
}

interface GeminiCandidate {
  content?: { parts: GeminiResponsePart[] };
  finishReason?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code: number; status: string };
}

const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);

function checkRateLimit(): void {
  const rateLimitResult = stickerGenerationLimiter.check('generate');
  if (!rateLimitResult.allowed) {
    const waitTime = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
    throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before generating more stickers.`);
  }
}

function extractImageFromResponse(response: GeminiGenerateContentResponse): string {
  if (response.error) {
    logger.error('Gemini API Error details:', response.error);
    // Never expose raw upstream message — CO4-013 pre-req
    throw new Error('error_process');
  }
  if (!response.candidates || response.candidates.length === 0) throw new Error('error_safety');

  const candidate = response.candidates[0];
  if (candidate.finishReason && candidate.finishReason !== 'STOP') {
    logger.error('Gemini Generation Failed. Finish Reason:', candidate.finishReason);
    throw new Error(candidate.finishReason === 'SAFETY' ? 'error_safety' : 'error_process');
  }

  const parts = candidate.content?.parts;
  if (!parts) throw new Error('error_no_image');

  for (const part of parts) {
    if (part.inlineData?.data) {
      logger.info('Sticker generated successfully');
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error('error_no_image');
}

const KNOWN_ERRORS = new Set([
  'error_safety', 'error_quota', 'error_timeout', 'error_upstream',
  'error_no_image', 'error_auth', 'error_payload', 'error_process'
]);

function handleGeminiError(error: unknown): never {
  logger.error('Gemini API Error:', error);
  const msg = error instanceof Error ? error.message : 'error_process';
  throw new Error(KNOWN_ERRORS.has(msg) ? msg : 'error_process');
}

/**
 * GP55-001: New contract — sends {imageBase64, styleId, variationId} only.
 * Backend is authoritative for model selection and prompt assembly.
 */
export const generateSticker = async (
  imageBase64: string,
  styleId: string,
  variationId: VariationId = 'default'
): Promise<string> => {
  checkRateLimit();
  try {
    logger.info('Generating sticker with style:', styleId, 'variation:', variationId);

    const apiCall = async () => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, styleId, variationId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(errorData.error || 'error_process');
      }
      return response.json();
    };

    const response: GeminiGenerateContentResponse = await withTimeout(apiCall(), API_TIMEOUT_MS, 'error_timeout');
    return extractImageFromResponse(response);
  } catch (error: unknown) {
    handleGeminiError(error);
  }
};

const throttledMap = async <T, R>(
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
      const e: Promise<void> = p.then(() => { executing.delete(e); }).catch(() => { executing.delete(e); });
      executing.add(e);
      if (executing.size >= concurrencyLimit) await Promise.race(executing);
    }
  }
  return Promise.all(results);
};

/**
 * CO4-009: variations param is now VariationId[] instead of string[].
 */
export const generateStickerSet = async (
  sourceImageBase64: string,
  styleId: string,
  variations: VariationId[]
): Promise<string[]> => {
  logger.info(`Generating sticker set with ${variations.length} variations`);
  return throttledMap(variations, (v) => generateSticker(sourceImageBase64, styleId, v), BATCH_CONCURRENCY);
};
