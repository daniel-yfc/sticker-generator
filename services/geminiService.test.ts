import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { STYLES } from '../constants';
import { stickerGenerationLimiter } from '../utils/rateLimit';

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
    beforeEach(() => {
      // Ensure rate limiter is mocked to always allow by default for tests
      vi.spyOn(stickerGenerationLimiter, 'check').mockReturnValue({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 5000
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws error when rate limit is exceeded', async () => {
      // Mock the rate limiter
      const checkSpy = vi.spyOn(stickerGenerationLimiter, 'check').mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 5000
      });

      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]))
        .rejects.toThrow(/Rate limit exceeded\. Please wait 5 seconds before generating more stickers\./);

      checkSpy.mockRestore();
    });

    it('throws error when imageBase64 is empty or invalid type', async () => {
      await expect(generateSticker('', STYLES[0]))
        .rejects.toThrow('Invalid image data');

      await expect(generateSticker(null as unknown as string, STYLES[0]))
        .rejects.toThrow('Invalid image data');
    });

    it('throws error when image data is too short', async () => {
      await expect(generateSticker('data:image/png;base64,short', STYLES[0]))
        .rejects.toThrow('Invalid or corrupted image data');
    });

    it('throws error when base64 data format is invalid', async () => {
      // Create string of 100 characters that is NOT valid base64
      const invalidChars = '!@#$%^&*()_+'.repeat(10);
      await expect(generateSticker(`data:image/png;base64,${invalidChars}`, STYLES[0]))
        .rejects.toThrow('Invalid base64 format');
    });

    it('throws error_no_image when no image data is returned', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                {
                  text: 'Here is your sticker'
                }
              ]
            }
          }
        ]
      });

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]))
        .rejects.toThrow('error_no_image');
    });

    it('throws error_no_image when parts are missing', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: {
            }
          }
        ]
      });

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]))
        .rejects.toThrow('error_no_image');
    });

    it('throws error_process when finishReason is not STOP or SAFETY', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'MAX_TOKENS',
            content: { parts: [{ text: 'incomplete' }] }
          }
        ]
      });

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]))
        .rejects.toThrow('error_process');
    });

    it('throws error_safety when no candidates are returned', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      mockGenerateContent.mockResolvedValue({
        candidates: []
      });

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]))
        .rejects.toThrow('error_safety');
    });

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

      const fakeImageBase64 = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
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

    it('generateSticker throws error if API key is missing', async () => {
      delete process.env.API_KEY;
      await expect(generateSticker('base64data', STYLES[0])).rejects.toThrow('API Key is missing');
    });

    it('generateSticker calls generateContent and returns image data', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
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

      const result = await generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0]);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles unsupported MIME types by defaulting to image/jpeg', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
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

      const result = await generateSticker(`data:application/pdf;base64,${validBase64}`, STYLES[0]);

      // Check that it was called with 'image/jpeg' and the right data
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: validBase64,
                }
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles base64 string without data URI scheme by defaulting to image/jpeg', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
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

      const result = await generateSticker(validBase64, STYLES[0]);

      // Check that it was called with 'image/jpeg' and the right data
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: validBase64,
                }
              })
            ])
          })
        })
      );
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });

    it('generateSticker handles safety error', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      const mockResponse = {
        candidates: [
          {
            finishReason: 'SAFETY',
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(`data:image/png;base64,${validBase64}`, STYLES[0])).rejects.toThrow('error_safety');
    });
  });

  describe('generateStickerSet', () => {
    it('generates multiple stickers in parallel', async () => {
      const validBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg'.repeat(10) + '==';
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ inlineData: { data: 'batch-img-data' } }] }
          }
        ]
      });
      const variations = ['var1', 'var2'];
      const results = await generateStickerSet(`data:image/png;base64,${validBase64}`, STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(results).toEqual(['data:image/png;base64,batch-img-data', 'data:image/png;base64,batch-img-data']);
    });
  });
});
