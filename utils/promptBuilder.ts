/**
 * CO4-009 / GP55-009: VariationId is now a strict union type.
 * The server (server.cjs) owns the authoritative prompt and style tables.
 * This file exports only the type and canonical ID list for frontend use.
 */

export type VariationId =
  | 'thumbs_up'
  | 'laughing'
  | 'surprised'
  | 'cool'
  | 'default';

export const VARIATION_IDS: readonly VariationId[] = [
  'thumbs_up',
  'laughing',
  'surprised',
  'cool',
  'default',
];

/**
 * @deprecated Client-side prompt building replaced by server-side assembly (GP55-009).
 * Kept temporarily so existing tests that import this function do not break.
 * Remove once all call sites are updated to the {styleId, variationId} contract.
 */
export function buildStickerPrompt(styleId: string, variationId: VariationId = 'default'): string {
  return `[server-side prompt: style=${styleId}, variation=${variationId}]`;
}
