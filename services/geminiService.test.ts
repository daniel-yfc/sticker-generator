import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSticker } from './geminiService';
import { GoogleGenAI } from '@google/genai';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn(),
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
      const mockGenerateContent = vi.fn().mockResolvedValue({
        candidates: [
          {
            finishReason: 'SAFETY',
            content: { parts: [] },
          },
        ],
      });

      // @ts-ignore
      vi.mocked(GoogleGenAI).mockImplementation(function() {
        return {
          models: {
            generateContent: mockGenerateContent,
          },
        };
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

      await expect(generateSticker(fakeImageBase64, fakeStyle)).rejects.toThrow(/^error_safety$/);
    });
  });
});
