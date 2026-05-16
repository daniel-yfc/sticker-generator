import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { STYLES } from '../constants';
import { VariationId } from '../utils/promptBuilder';
import { stickerGenerationLimiter } from '../utils/rateLimit';

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

// Mock the rate limiter so we don't run into it during tests
vi.mock('../utils/rateLimit', () => {
  return {
    stickerGenerationLimiter: { check: vi.fn(() => ({ allowed: true, remaining: 10, resetTime: 0 })) }
  };
});

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

      await expect(generateSticker(fakeImageBase64, STYLES[0].style))
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
      const result = await generateSticker(validBase64, STYLES[0].style);

      expect(global.fetch).toHaveBeenCalledWith('/api/generate', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('A'.repeat(100))
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
      await expect(generateSticker(validBase64, STYLES[0].style)).rejects.toThrow('Some server error');
    });

    it('generateSticker handles network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0].style)).rejects.toThrow('Network error');
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

      const variations: VariationId[] = ['thumbs_up', 'laughing'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const results = await generateStickerSet(validBase64, STYLES[0].style, variations);

      expect(results).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['data:image/png;base64,batch-img-data', 'data:image/png;base64,batch-img-data']);
    });

    it('rejects if any sticker generation fails', async () => {
      // First call succeeds, second fails
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { data: 'batch-img-data' } }] } }]
          })
        })
        .mockRejectedValueOnce(new Error('API Error'));

      const variations: VariationId[] = ['thumbs_up', 'laughing'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);

      await expect(generateStickerSet(validBase64, STYLES[0].style, variations)).rejects.toThrow('API Error');
    });
  });

});
