import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { STYLES } from '../constants';

const originalFetch = global.fetch;

// Create a mock for localStorage to satisfy rateLimit.ts in non-browser environments
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('geminiService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('generateSticker', () => {
    it('throws an error if the generation finishes with SAFETY reason', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'SAFETY',
              content: { parts: [] }
            }
          ]
        })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const fakeImageBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const fakeStyle = STYLES[0];

      await expect(generateSticker(fakeImageBase64, fakeStyle))
        .rejects
        .toThrow('error_safety');
    });

    it('generateSticker calls fetch and returns image data', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [
                  {
                    inlineData: {
                      data: 'generated-image-base64',
                    },
                  },
                ],
              },
            },
          ],
        })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const result = await generateSticker(validBase64, STYLES[0]);

      expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('generated-image-base64')
      }));
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles server error responses', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          error: 'Some server error'
        })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('Some server error');
    });

    it('generateSticker handles network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('Network error');
    });
  });

  describe('generateStickerSet', () => {
    it('generates multiple stickers', async () => {
       const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [
                  {
                    inlineData: {
                      data: 'batch-img-data',
                    },
                  },
                ],
              },
            },
          ],
        })
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const variations = ['var1', 'var2'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const results = await generateStickerSet(validBase64, STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['data:image/png;base64,batch-img-data', 'data:image/png;base64,batch-img-data']);
    });
  });

});
