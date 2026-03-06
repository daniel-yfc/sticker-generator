import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { STYLES } from '../constants';

const originalEnv = process.env;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('geminiService', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, API_KEY: 'test-api-key' };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('generateSticker', () => {
    it('throws an error if the generation finishes with SAFETY reason', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'error_safety' })
      });

      const fakeImageBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const fakeStyle = {
        id: 1,
        style: 'Test Style',
        basePrompt: 'Test base prompt',
        modifiers: { person: 'person', object: 'object', landscape: 'landscape' },
        previewColor: 'red',
        iconName: 'icon'
      };

      await expect(generateSticker(fakeImageBase64, fakeStyle))
        .rejects
        .toThrow('error_safety');
    });

    it('generateSticker calls fetch and returns image data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ image: 'data:image/png;base64,generated-image-base64' })
      });

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const result = await generateSticker(validBase64, STYLES[0]);

      expect(mockFetch).toHaveBeenCalledWith('/api/generate-sticker', expect.any(Object));
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'error_process' })
      });

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('error_process');
    });

    it('generateSticker handles generic safety error from API', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'error_safety' })
      });

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('error_safety');
    });
  });

  describe('generateStickerSet', () => {
    it('generates multiple stickers in parallel via backend', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ image: 'data:image/png;base64,batch-img-data' })
      });
      const variations = ['var1', 'var2'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const results = await generateStickerSet(validBase64, STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['data:image/png;base64,batch-img-data', 'data:image/png;base64,batch-img-data']);
    });
  });
});
