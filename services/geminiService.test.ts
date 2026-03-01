import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSticker, generateStickerSet } from './geminiService';
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

// Import the mocked class to check calls
import { GoogleGenAI } from '@google/genai';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_KEY = 'test-api-key';
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

    // We can't easily check constructor arguments with class mock this way unless we spy on it,
    // but the main thing is it runs.
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
