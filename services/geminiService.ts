
import { GoogleGenAI } from "@google/genai";
import { StyleOption } from "../types";

const processEnvApiKey = process.env.API_KEY;

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
  if (!processEnvApiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  try {
    // Extract MIME type and base64 data
    const mimeMatch = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/(?:png|jpeg|jpg|webp);base64,/, "");
    
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

    const response: any = await withTimeout(
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
      console.error("Gemini Generation Failed. Finish Reason:", candidate.finishReason);
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

  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    const msg = error.message || "error_process";
    throw new Error(msg);
  }
};

/**
 * Generates a batch of variations based on a source image and style
 */
export const generateStickerSet = async (
  sourceImageBase64: string,
  style: StyleOption,
  variations: string[]
): Promise<string[]> => {
  // Call generation in parallel for faster results
  const promises = variations.map(v => generateSticker(sourceImageBase64, style, v));
  return Promise.all(promises);
};
