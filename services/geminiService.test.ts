import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { StyleOption } from '../types';

// Mock the GoogleGenAI module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(),
  };
});

describe('geminiService', () => {
  const originalEnv = process.env;

  const mockStyle: StyleOption = {
    id: 1,
    style: 'Anime',
    basePrompt: 'Anime style',
    modifiers: { person: 'vibrant colors', object: '', landscape: '' },
    previewColor: '#000000',
    iconName: 'Sparkles'
  };

  const mockImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  let mockGenerateContent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, API_KEY: 'test-api-key' };

    mockGenerateContent = vi.fn();

    (GoogleGenAI as any).mockImplementation(function() {
      return {
        models: {
          generateContent: mockGenerateContent
        }
      };
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('generateSticker', () => {
    it('throws error if API_KEY is missing', async () => {
      delete process.env.API_KEY;
      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('API Key is missing. Please check your configuration.');
    });

    it('returns base64 image data on successful generation', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'fake-generated-image-data'
                  }
                }
              ]
            }
          }
        ]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const result = await generateSticker(mockImageBase64, mockStyle);
      expect(result).toBe('data:image/png;base64,fake-generated-image-data');
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('throws error_safety if no candidates are returned', async () => {
      mockGenerateContent.mockResolvedValue({ candidates: [] });

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_safety');
    });

    it('throws error_safety if finishReason is SAFETY', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] }
          }
        ]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_safety');
    });

    it('throws error_process if finishReason is not STOP or SAFETY', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'MAX_TOKENS',
            content: { parts: [] }
          }
        ]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_process');
    });

    it('throws error_no_image if parts array is missing', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {}
          }
        ]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_no_image');
    });

    it('throws error_no_image if inlineData is missing in parts', async () => {
      const mockResponse = {
        candidates: [
          {
            finishReason: 'STOP',
            content: {
              parts: [
                { text: 'some text instead of image' }
              ]
            }
          }
        ]
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_no_image');
    });

    it('handles timeout correctly by throwing error_timeout', async () => {
      vi.useFakeTimers();

      // A promise that never resolves
      mockGenerateContent.mockImplementation(() => new Promise(() => {}));

      const generatePromise = generateSticker(mockImageBase64, mockStyle);

      // Fast-forward time by 60 seconds (the timeout duration in the code)
      vi.advanceTimersByTime(60000);

      await expect(generatePromise).rejects.toThrow('error_timeout');

      vi.useRealTimers();
    });

    it('passes underlying API error messages if thrown', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Internal Server Error'));

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('Internal Server Error');
    });

    it('uses correct default prompt without variationPrompt', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ inlineData: { data: 'img' } }] }
          }
        ]
      });

      await generateSticker(mockImageBase64, mockStyle);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const textPart = callArgs.contents.parts.find((p: any) => p.text);
      expect(textPart.text).toContain('Expression: Expressive and charismatic.');
    });

    it('uses variationPrompt when provided', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ inlineData: { data: 'img' } }] }
          }
        ]
      });

      await generateSticker(mockImageBase64, mockStyle, 'winking');

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const textPart = callArgs.contents.parts.find((p: any) => p.text);
      expect(textPart.text).toContain('Expression/Action Variation: winking. Ensure the style remains consistent.');
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

      const variations = ['happy', 'sad'];
      const result = await generateStickerSet(mockImageBase64, mockStyle, variations);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        'data:image/png;base64,batch-img-data',
        'data:image/png;base64,batch-img-data'
      ]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
