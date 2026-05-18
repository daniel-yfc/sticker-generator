'use strict';

// ---------------------------------------------------------------------------
// Prompt construction — extracted from server.cjs for testability (CO4-025)
// ---------------------------------------------------------------------------

const VARIATION_FRAGMENTS = {
  thumbs_up: 'Expression/Action: giving a thumbs up, cheerful.',
  laughing:  'Expression/Action: laughing heartily, mouth open, joyful.',
  surprised: 'Expression/Action: eyes wide open, surprised expression.',
  cool:      'Expression/Action: cool and confident, slight smirk.',
  default:   'Expression: Expressive and charismatic.',
};

const VALID_VARIATION_IDS = new Set(Object.keys(VARIATION_FRAGMENTS));

const STYLE_PROMPTS = {
  'chibi-anime':    { base: 'Chibi anime style, big expressive eyes, simplified cute proportions, vibrant colors', person: 'adorable chibi character' },
  'pixar-3d':       { base: 'Pixar/Disney 3D animation style, smooth surfaces, expressive face, warm lighting', person: 'charming 3D animated character' },
  'flat-vector':    { base: 'Flat vector illustration, bold outlines, minimal shading, clean geometric shapes', person: 'stylized flat vector person' },
  'watercolor':     { base: 'Watercolor painting style, soft edges, translucent washes, artistic brushwork', person: 'watercolor portrait character' },
  'comic-book':     { base: 'Comic book style, bold ink outlines, halftone shading, dynamic composition', person: 'comic book hero character' },
  'sticker-pop':    { base: 'Bold pop-art sticker style, high contrast colors, thick outlines, playful energy', person: 'pop-art sticker character' },
  'sketch':         { base: 'Hand-drawn pencil sketch style, expressive lines, cross-hatching, artistic texture', person: 'sketched portrait character' },
  'neon-cyberpunk': { base: 'Neon cyberpunk style, glowing edges, dark background elements, futuristic details', person: 'cyberpunk character with neon accents' },
  'minimalist':     { base: 'Minimalist style, simple clean lines, limited color palette, essential details only', person: 'minimalist stylized person' },
  'retro-cartoon':  { base: 'Retro cartoon style, vintage animation aesthetic, bold lines, classic cartoon proportions', person: 'retro cartoon character' },
  'oil-painting':   { base: 'Oil painting style, rich textured brushstrokes, classical portrait composition, depth', person: 'oil painted portrait character' },
  'emoji-style':    { base: 'Emoji/emoticon style, simple expressive face, bold outlines, bright flat colors', person: 'emoji-style face character' },
};

const VALID_STYLE_IDS = new Set(Object.keys(STYLE_PROMPTS));

/**
 * Build the Gemini prompt for the given style and variation.
 * Throws a plain Error with a `code` property for unknown IDs.
 *
 * @param {string} styleId
 * @param {string} variationId
 * @returns {string}
 */
function buildPrompt(styleId, variationId) {
  if (!VALID_STYLE_IDS.has(styleId)) {
    const err = new Error(`Unknown styleId: ${styleId}`);
    err.code = 'error_payload';
    throw err;
  }
  if (!VALID_VARIATION_IDS.has(variationId)) {
    const err = new Error(`Unknown variationId: ${variationId}`);
    err.code = 'error_payload';
    throw err;
  }
  const style = STYLE_PROMPTS[styleId];
  const variationFragment = VARIATION_FRAGMENTS[variationId];
  const styleDescription = `${style.base}, depicting a ${style.person}`;
  return (
    `Generate a high-quality die-cut sticker of the person in the provided image.\n\n` +
    `ART STYLE: ${styleDescription}.\n\n` +
    `CRITICAL INSTRUCTIONS:\n` +
    `1. TRANSFORM the subject into a stylistic illustration matching the Art Style.\n` +
    `2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.\n` +
    `3. SIMPLIFY details to match the sticker aesthetic.\n` +
    `4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).\n` +
    `5. Use a solid white background.\n\n` +
    `${variationFragment}`
  );
}

module.exports = {
  buildPrompt,
  STYLE_PROMPTS,
  VARIATION_FRAGMENTS,
  VALID_STYLE_IDS,
  VALID_VARIATION_IDS,
};
