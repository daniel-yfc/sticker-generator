import { describe, it, expect } from 'vitest';
import { buildStickerPrompt } from './promptBuilder';

describe('promptBuilder', () => {
  const mockStyleId = 'Test Style';

  describe('buildStickerPrompt', () => {
    it('builds a base prompt correctly', () => {
      const prompt = buildStickerPrompt(mockStyleId);

      expect(prompt).toContain('server-side prompt');
      expect(prompt).toContain('Test Style');
    });

    it('includes variation instruction when provided', () => {
      const prompt = buildStickerPrompt(mockStyleId, 'thumbs_up');

      expect(prompt).toContain('server-side prompt');
      expect(prompt).toContain('Test Style');
      expect(prompt).toContain('thumbs_up');
    });
  });
});
