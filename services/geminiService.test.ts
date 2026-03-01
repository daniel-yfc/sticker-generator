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
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] },
          },
        ],
      });

      const fakeImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const fakeStyle = {
        id: 1,
        style: 'Test Style',
        basePrompt: 'Test base prompt',
        modifiers: { person: 'person', object: 'object', landscape: 'landscape' },
        previewColor: 'red',
        iconName: 'icon'
      };

      await expect(generateSticker(fakeImageBase64, fakeStyle)).rejects.toThrow('error_safety');
    });

    it('throws error if API key is missing', async () => {
      delete process.env.API_KEY;
      await expect(generateSticker('base64data', STYLES[0])).rejects.toThrow('API Key is missing');
    });

    it('calls generateContent and returns image data', async () => {
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
      mockGenerateContent.mockResolvedValueOnce(mockResponse);

      const result = await generateSticker('data:image/png;base64,source-image', STYLES[0]);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,generated-image-base64');
    });
  });

  describe('generateStickerSet', () => {
    it('generates multiple stickers', async () => {
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
      const results = await generateStickerSet('data:image/png;base64,source-image', STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
