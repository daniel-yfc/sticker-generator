/**
 * Prompt invariant tests (CO4-025)
 *
 * Run with: node --test server/promptBuilder.test.mjs
 * Or via the existing npm test pipeline if vitest/node:test is wired.
 */

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
  buildPrompt,
  VALID_STYLE_IDS,
  VALID_VARIATION_IDS,
} = require('./promptBuilder.cjs');

const ALL_STYLE_IDS = [...VALID_STYLE_IDS];
const ALL_VARIATION_IDS = [...VALID_VARIATION_IDS];

const REQUIRED_GUARDRAILS = [
  'sticker',
  'WHITE BORDER',
  'DO NOT produce a realistic photo',
];

// ---------------------------------------------------------------------------
// 1. All style IDs render
// ---------------------------------------------------------------------------
describe('all style IDs render', () => {
  for (const styleId of ALL_STYLE_IDS) {
    test(`style: ${styleId}`, () => {
      const prompt = buildPrompt(styleId, 'default');
      assert.equal(typeof prompt, 'string');
      assert.ok(prompt.length > 0, `prompt for ${styleId} must not be empty`);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. All variation IDs render
// ---------------------------------------------------------------------------
describe('all variation IDs render', () => {
  for (const variationId of ALL_VARIATION_IDS) {
    test(`variation: ${variationId}`, () => {
      const prompt = buildPrompt('flat-vector', variationId);
      assert.equal(typeof prompt, 'string');
      assert.ok(prompt.length > 0, `prompt for variation ${variationId} must not be empty`);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Every rendered prompt contains required guardrail substrings
// ---------------------------------------------------------------------------
describe('guardrails present in all styles', () => {
  for (const styleId of ALL_STYLE_IDS) {
    test(`guardrails: ${styleId}`, () => {
      const prompt = buildPrompt(styleId, 'default');
      for (const guardrail of REQUIRED_GUARDRAILS) {
        assert.ok(
          prompt.includes(guardrail),
          `prompt for style "${styleId}" is missing guardrail: "${guardrail}"`
        );
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Unknown styleId throws
// ---------------------------------------------------------------------------
test('unknown styleId throws with code error_payload', () => {
  assert.throws(
    () => buildPrompt('not-a-style', 'default'),
    (err) => {
      assert.ok(err instanceof Error);
      assert.equal(err.code, 'error_payload');
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// 5. Unknown variationId throws
// ---------------------------------------------------------------------------
test('unknown variationId throws with code error_payload', () => {
  assert.throws(
    () => buildPrompt('flat-vector', 'not-a-variation'),
    (err) => {
      assert.ok(err instanceof Error);
      assert.equal(err.code, 'error_payload');
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// 6. Snapshot — canonical prompts
// Removing a guardrail from any style will cause this test to fail.
// Update snapshots only with intentional review.
// ---------------------------------------------------------------------------
describe('prompt snapshots', () => {
  const SNAPSHOTS = {
    'flat-vector': {
      thumbs_up:
        'Generate a high-quality die-cut sticker of the person in the provided image.\n\n' +
        'ART STYLE: Flat vector illustration, bold outlines, minimal shading, clean geometric shapes, depicting a stylized flat vector person.\n\n' +
        'CRITICAL INSTRUCTIONS:\n' +
        '1. TRANSFORM the subject into a stylistic illustration matching the Art Style.\n' +
        '2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.\n' +
        '3. SIMPLIFY details to match the sticker aesthetic.\n' +
        '4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).\n' +
        '5. Use a solid white background.\n\n' +
        'Expression/Action: giving a thumbs up, cheerful.',
    },
    'chibi-anime': {
      default:
        'Generate a high-quality die-cut sticker of the person in the provided image.\n\n' +
        'ART STYLE: Chibi anime style, big expressive eyes, simplified cute proportions, vibrant colors, depicting a adorable chibi character.\n\n' +
        'CRITICAL INSTRUCTIONS:\n' +
        '1. TRANSFORM the subject into a stylistic illustration matching the Art Style.\n' +
        '2. DO NOT produce a realistic photo. The result must look like a drawing, painting, or 3D render.\n' +
        '3. SIMPLIFY details to match the sticker aesthetic.\n' +
        '4. Add a thick, clean WHITE BORDER surrounding the subject (die-cut style).\n' +
        '5. Use a solid white background.\n\n' +
        'Expression: Expressive and charismatic.',
    },
  };

  for (const [styleId, variations] of Object.entries(SNAPSHOTS)) {
    for (const [variationId, expected] of Object.entries(variations)) {
      test(`snapshot: ${styleId} / ${variationId}`, () => {
        const actual = buildPrompt(styleId, variationId);
        assert.equal(
          actual,
          expected,
          `Snapshot mismatch for ${styleId}/${variationId}. ` +
          'If this change is intentional, update the snapshot in this file.'
        );
      });
    }
  }
});
