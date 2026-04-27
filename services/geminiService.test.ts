import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet, throttledMap } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { STYLES } from '../constants';

const originalEnv = process.env;

// Mock the GoogleGenAI library
let mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
        constructor() {
        }
        models = {
            generateContent: (...args: any[]) => mockGenerateContent(...args)
        }
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, API_KEY: 'test-api-key' };
    mockGenerateContent = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('generateSticker', () => {
    it('throws an error if the generation finishes with SAFETY reason', async () => {
      // Setup the mock to return a safety response
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] }
          }
        ]
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

    it('generateSticker throws error if API key is missing, empty, or whitespace', async () => {
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);

      // Test undefined API key
      delete process.env.API_KEY;
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('API Key is missing. Please check your configuration.');

      // Test empty string API key
      process.env.API_KEY = '';
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('API Key is missing. Please check your configuration.');

      // Test whitespace API key
      process.env.API_KEY = '   ';
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('API Key is missing. Please check your configuration.');
    });

    it('generateSticker calls generateContent and returns image data', async () => {
      const mockResponse = {
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
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const result = await generateSticker(validBase64, STYLES[0]);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles unsupported MIME types by defaulting to image/jpeg', async () => {
      const mockResponse = {
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
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const validData = 'A'.repeat(100);
      const result = await generateSticker(`data:application/pdf;base64,${validData}`, STYLES[0]);

      // Check that it was called with 'image/jpeg' and the right data
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: validData, // The updated replace regex will extract the base64 part
                }
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles base64 string without data URI scheme by defaulting to image/jpeg', async () => {
      const mockResponse = {
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
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const validData = 'A'.repeat(100);
      const result = await generateSticker(validData, STYLES[0]);

      // Check that it was called with 'image/jpeg' and the right data
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: validData,
                }
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles safety error', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'SAFETY',
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      await expect(generateSticker(validBase64, STYLES[0])).rejects.toThrow('error_safety');
    });
  });

  describe('generateStickerSet', () => {
    it('generates multiple stickers in parallel', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ inlineData: { data: 'batch-img-data' } }] }
          }
        ]
      });
      const variations = ['var1', 'var2'];
      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(100);
      const results = await generateStickerSet(validBase64, STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['data:image/png;base64,batch-img-data', 'data:image/png;base64,batch-img-data']);
    });
  });

  describe('throttledMap', () => {
    it('maps items correctly', async () => {
      const items = [1, 2, 3];
      const fn = vi.fn(async (x: number) => x * 2);
      const results = await throttledMap(items, fn);
      expect(results).toEqual([2, 4, 6]);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('respects concurrency limit', async () => {
      const items = [1, 2, 3, 4, 5];
      let activeCount = 0;
      let maxActiveCount = 0;
      const concurrencyLimit = 2;

      const fn = vi.fn(async (x: number) => {
        activeCount++;
        maxActiveCount = Math.max(maxActiveCount, activeCount);
        // Small delay to ensure they stay "active"
        await new Promise(resolve => setTimeout(resolve, 10));
        activeCount--;
        return x;
      });

      const results = await throttledMap(items, fn, concurrencyLimit);

      expect(results).toEqual(items);
      expect(maxActiveCount).toBeLessThanOrEqual(concurrencyLimit);
    });

    it('maintains order of results regardless of execution time', async () => {
      const items = [100, 10, 50];
      const fn = async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, x));
        return x;
      };

      const results = await throttledMap(items, fn, 2);
      expect(results).toEqual([100, 10, 50]);
    });

    it('handles empty array', async () => {
      const fn = vi.fn();
      const results = await throttledMap([], fn);
      expect(results).toEqual([]);
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles concurrency limit greater than items length', async () => {
      const items = [1, 2];
      const fn = vi.fn(async (x) => x);
      const results = await throttledMap(items, fn, 5);
      expect(results).toEqual([1, 2]);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('rejects if any task fails', async () => {
      const items = [1, 2, 3];
      const fn = async (x: number) => {
        if (x === 2) throw new Error('Task failed');
        return x;
      };

      await expect(throttledMap(items, fn, 2)).rejects.toThrow('Task failed');
    });

    it('continues processing remaining items even if some fail (but still rejects in the end)', async () => {
      // This is to verify the internal behavior where errors don't stop the loop
      // although Promise.all will reject eventually.
      const items = [1, 2, 3];
      const completed: number[] = [];
      const fn = async (x: number) => {
        if (x === 1) throw new Error('Task 1 failed');
        await new Promise(resolve => setTimeout(resolve, 10));
        completed.push(x);
        return x;
      };

      try {
        await throttledMap(items, fn, 1);
      } catch (e) {
        // Expected
      }

      // Even though task 1 failed, task 2 and 3 should have been started because of how throttledMap is implemented.
      // Wait, let's look at the implementation again.
      // for (const item of items) {
      //   const p = Promise.resolve().then(() => fn(item));
      //   results.push(p);
      //   ...
      //   const e = p.then(() => ...).catch(() => { executing.delete(e); });
      //   executing.add(e);
      //   if (executing.size >= concurrencyLimit) { await Promise.race(executing); }
      // }
      // return Promise.all(results);

      // If fn(item) throws, p rejects.
      // then/catch on p will handle it and remove from 'executing'.
      // The loop continues.
      // So all tasks are eventually started.

      expect(completed).toContain(2);
      expect(completed).toContain(3);
    });
  });
});
