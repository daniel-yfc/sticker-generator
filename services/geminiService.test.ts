import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
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
});
