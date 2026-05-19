import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { STYLES } from '../constants';
import { VariationId } from '../utils/promptBuilder';
import { StickerSetTile } from '../types';
import { stickerGenerationLimiter } from '../utils/rateLimit';

const originalFetch = global.fetch;

const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

vi.mock('../utils/rateLimit', () => {
  return {
    stickerGenerationLimiter: { check: vi.fn(() => ({ allowed: true, remaining: 10, resetTime: 0 })) }
  };
});

const FAKE_TOKEN = 'test-captcha-token';

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

      await expect(generateSticker(fakeImageBase64, STYLES[0].style, 'default', FAKE_TOKEN))
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
      const result = await generateSticker(validBase64, STYLES[0].style, 'default', FAKE_TOKEN);

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
      await expect(generateSticker(validBase64, STYLES[0].style, 'default', FAKE_TOKEN)).rejects.toThrow('error_process');
    });

    it('generateSticker handles network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0].style, 'default', FAKE_TOKEN)).rejects.toThrow('Network error');
    });
  });

  describe('generateStickerSet', () => {
    it('calls onTileSettled with done for each successful variation', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'STOP',
              content: {
                parts: [{ inlineData: { data: 'batch-img-data' } }],
              },
            },
          ],
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const variations: VariationId[] = ['thumbs_up', 'laughing'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const settled: StickerSetTile[] = [];

      await generateStickerSet(validBase64, STYLES[0].style, variations, FAKE_TOKEN, (tile) => {
        settled.push(tile);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(settled).toHaveLength(2);
      expect(settled.every(t => t.status === 'done')).toBe(true);
      expect(settled.map(t => t.imageUrl)).toEqual([
        'data:image/png;base64,batch-img-data',
        'data:image/png;base64,batch-img-data',
      ]);
    });

    it('calls onTileSettled with failed for a failing variation without discarding successful ones', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { data: 'good-img' } }] } }],
          }),
        })
        .mockRejectedValueOnce(new Error('error_process'));

      const variations: VariationId[] = ['thumbs_up', 'laughing'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const settled: StickerSetTile[] = [];

      await generateStickerSet(validBase64, STYLES[0].style, variations, FAKE_TOKEN, (tile) => {
        settled.push(tile);
      });

      expect(settled).toHaveLength(2);
      const done = settled.filter(t => t.status === 'done');
      const failed = settled.filter(t => t.status === 'failed');
      expect(done).toHaveLength(1);
      expect(done[0].imageUrl).toBe('data:image/png;base64,good-img');
      expect(failed).toHaveLength(1);
      expect(failed[0].retryable).toBe(true);
    });
  });

});
