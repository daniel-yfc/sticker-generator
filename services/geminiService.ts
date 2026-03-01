
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { StyleOption } from "../types";
import { logger } from "../utils/logger";

/**
 * Helper to race a promise against a timeout
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    )
  ]);
};

export const generateSticker = async (
  imageBase64: string,
  style: StyleOption,
  variationPrompt?: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Extract MIME type and base64 data
    const mimeMatch = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // For unsupported MIME types or invalid formats, attempt a generic replacement to extract the base64 part
    let base64Data = imageBase64.replace(/^data:image\/(?:png|jpeg|jpg|webp);base64,/, "");
    if (base64Data === imageBase64 && imageBase64.startsWith("data:")) {
      base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");
    }
    
    // Improved Prompt Engineering v2
    // Focus on "Transformation" and "Artistic Medium" to avoid photorealism.
    // Explicitly requesting "Illustration" and "Die-cut sticker".
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
      60000,
      "error_timeout"
    );

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
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("error_no_image");

  } catch (error: unknown) {
    console.error("Gemini API Error details:", error);
    const msg = error instanceof Error ? error.message : "error_process";
    throw new Error(msg);
  }
};

export const throttledMap = async <T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrencyLimit: number = 2
): Promise<R[]> => {
  const results: Promise<R>[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);

    if (concurrencyLimit <= items.length) {
      const e: Promise<void> = p.then(() => {
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
 * Generates a batch of variations based on a source image and style
 */
export const generateStickerSet = async (
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[]
): Promise<string[]> => {
  return throttledMap(variations, (v) => generateSticker(sourceImageBase64, style, v), 2);
};
