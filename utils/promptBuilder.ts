/**
 * CO4-009 / GP55-009: VariationId is now a strict union type.
 * The server (server.cjs) is the authoritative owner of all prompt content.
 * This file exports only the type and canonical ID list for frontend use.
 */

export type VariationId =
  | 'thumbs_up'
  | 'laughing'
  | 'surprised'
  | 'cool'
  | 'default';

export const VARIATION_IDS: VariationId[] = [
  'thumbs_up',
  'laughing',
  'surprised',
  'cool',
  'default',
];

/**
 * @deprecated Client-side prompt building is superseded by server-side assembly (GP55-009).
 * Kept as a stub so existing test imports don't break. Remove once all call sites are updated.
 */
export function buildStickerPrompt(styleId: string, variationId: VariationId = 'default'): string {
  return `[server-side prompt: style=${styleId}, variation=${variationId}]`;
}
