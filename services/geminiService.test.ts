import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { STYLES } from '../constants';

// Mock the GoogleGenAI library
const mockGenerateContent = vi.fn();

// Mock inside vi.mock to avoid hoisting issues
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
        constructor() {
        }
        models = {
            generateContent: mockGenerateContent
        }
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
  });

  describe('generateSticker', () => {
    it('throws an error if the generation finishes with SAFETY reason', async () => {
      // Setup the mock to return a safety response
      const mockResponse = {
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const fakeImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const fakeStyle = {
        id: 1,
        style: 'Test Style',
        basePrompt: 'Test base prompt',
        modifiers: { person: 'person', object: 'object', landscape: 'landscape' },
        previewColor: 'red',
        iconName: 'icon'
      };

      await expect(generateSticker(fakeImageBase64, fakeStyle)).rejects.toThrow(/^error_safety$/);
    });

    it('generateSticker throws error if API key is missing', async () => {
      delete process.env.API_KEY;
      await expect(generateSticker('data:image/png;base64,VALIDBASE64', STYLES[0])).rejects.toThrow('API Key is missing');
    });

    it('throws error for invalid data URI format', async () => {
      // Missing mime type
      await expect(generateSticker('data:base64,1234', STYLES[0])).rejects.toThrow('Invalid image format or unsupported MIME type');
      // Invalid mime type
      await expect(generateSticker('data:image/svg+xml;base64,1234', STYLES[0])).rejects.toThrow('Invalid image format or unsupported MIME type');
      // Invalid characters in base64
      await expect(generateSticker('data:image/png;base64,invalid chars!!', STYLES[0])).rejects.toThrow('Invalid image format or unsupported MIME type');
      // No base64 data
      await expect(generateSticker('data:image/png;base64,', STYLES[0])).rejects.toThrow('Invalid image format or unsupported MIME type');
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

      const result = await generateSticker('data:image/png;base64,sourceimage', STYLES[0]);

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

      await expect(generateSticker('data:image/png;base64,sourceimage', STYLES[0])).rejects.toThrow('error_safety');
    });

    it('generateStickerSet generates multiple stickers', async () => {
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

      const variations = ['var1', 'var2'];
      const results = await generateStickerSet('data:image/png;base64,sourceimage', STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});