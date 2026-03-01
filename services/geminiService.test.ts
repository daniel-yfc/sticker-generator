import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
import { GoogleGenAI } from '@google/genai';
import { STYLES } from '../constants';
import { GoogleGenAI } from '@google/genai';

// Mock the GoogleGenAI library
const mockGenerateContent = vi.fn();

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

describe('geminiService', () => {
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
    it('throws an error if the generation finishes with SAFETY reason', async () => {
      // Setup the mock to return a safety response
      mockGenerateContent.mockResolvedValue({
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] }
          }
        ]
      };

      const fakeImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
      const fakeStyle = {
        id: 1,
        style: 'Test Style',
        basePrompt: 'Test base prompt',
        modifiers: { person: 'person', object: 'object', landscape: 'landscape' },
        previewColor: 'red',
        iconName: 'icon'
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      await expect(generateSticker(mockImageBase64, mockStyle))
        .rejects
        .toThrow('error_process');
    });

    it('generateSticker throws error if API key is missing', async () => {
      delete process.env.API_KEY;
      await expect(generateSticker('base64data', STYLES[0])).rejects.toThrow('API Key is missing');
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

      const result = await generateSticker('data:image/png;base64,source-image', STYLES[0]);

      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,generated-image-base64');
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
              ],
            },
          },
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await generateSticker('data:application/pdf;base64,some-pdf-data', STYLES[0]);

    // Check that it was called with 'image/jpeg' and the right data
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              inlineData: {
                mimeType: 'image/jpeg',
                data: 'some-pdf-data', // The updated replace regex will extract the base64 part
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
              ],
            },
          },
        ],
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

    const result = await generateSticker('just-a-base64-string', STYLES[0]);

    // Check that it was called with 'image/jpeg' and the right data
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: expect.objectContaining({
          parts: expect.arrayContaining([
            expect.objectContaining({
              inlineData: {
                mimeType: 'image/jpeg',
                data: 'just-a-base64-string',
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

      await expect(generateSticker('data:image/png;base64,source-image', STYLES[0])).rejects.toThrow('error_safety');
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
      const results = await generateStickerSet('data:image/png;base64,source-image', STYLES[0], variations);

      expect(results).toHaveLength(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
});
