import { StyleOption } from "../types";

/**
 * Builds the text prompt for the sticker generation API
 * @param style - Style configuration for the sticker
 * @param variationPrompt - Optional prompt for variation
 * @returns The final constructed prompt
 */
export function buildStickerPrompt(style: StyleOption, variationPrompt?: string): string {
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
