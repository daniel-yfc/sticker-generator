import { describe, it, expect } from 'vitest';
import { buildStickerPrompt } from './promptBuilder';
import { StyleOption } from '../types';

describe('promptBuilder', () => {
  const mockStyle: StyleOption = {
    id: 1,
    style: 'Test Style',
    basePrompt: 'Test base prompt',
    modifiers: { person: 'person modifier', object: 'object', landscape: 'landscape' },
    previewColor: 'red',
    iconName: 'icon'
  };

  describe('buildStickerPrompt', () => {
    it('builds a base prompt correctly', () => {
      const prompt = buildStickerPrompt(mockStyle);

      expect(prompt).toContain('Generate a high-quality die-cut sticker');
      expect(prompt).toContain('ART STYLE: Test base prompt person modifier');
      expect(prompt).toContain('Expression: Expressive and charismatic.');
    });

    it('includes variation instruction when provided', () => {
      const prompt = buildStickerPrompt(mockStyle, 'smiling happily');

      expect(prompt).toContain('Generate a high-quality die-cut sticker');
      expect(prompt).toContain('ART STYLE: Test base prompt person modifier');
      expect(prompt).toContain('Expression/Action Variation: smiling happily');
      expect(prompt).not.toContain('Expression: Expressive and charismatic.');
    });
  });
});
