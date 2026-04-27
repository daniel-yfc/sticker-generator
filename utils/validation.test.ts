import { describe, it, expect } from 'vitest';
import {
  validateFile,
  validateImageDimensions,
  validateLocalStorageData,
  sanitizeErrorMessage,
  isValidStickerRecord,
  validateHistory,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from './validation';

describe('validation utilities', () => {
  describe('validateFile', () => {
    it('should accept valid image files', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files exceeding size limit', () => {
      const largeContent = new Array(MAX_FILE_SIZE + 1000).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should reject unsupported MIME types', () => {
      const file = new File(['content'], 'test.gif', { type: 'image/gif' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not supported');
    });

    it('should reject invalid file extensions', () => {
      const file = new File(['content'], 'test.txt', { type: 'image/jpeg' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });

    it('should accept all allowed MIME types', () => {
      ALLOWED_MIME_TYPES.forEach(mimeType => {
        const ext = mimeType.split('/')[1];
        const file = new File(['content'], `test.${ext}`, { type: mimeType });
        const result = validateFile(file);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept images within dimension limits', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const dataUrl = canvas.toDataURL();
      
      const result = await validateImageDimensions(dataUrl);
      expect(result.valid).toBe(true);
    });

    it('should reject images exceeding dimension limits', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 5000;
      canvas.height = 5000;
      const dataUrl = canvas.toDataURL();
      
      const result = await validateImageDimensions(dataUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceed');
    });
  });

  describe('validateLocalStorageData', () => {
    it('should accept valid JSON data within size limit', () => {
      const data = JSON.stringify({ test: 'data' });
      const result = validateLocalStorageData('test', data);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid JSON data', () => {
      const result = validateLocalStorageData('test', 'not valid json{');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should reject data exceeding size limit', () => {
      const largeData = JSON.stringify({ data: new Array(6 * 1024 * 1024).fill('a') });
      const result = validateLocalStorageData('test', largeData);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove script tags', () => {
      const message = 'Error: <script>alert("xss")</script>Something went wrong';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove HTML tags', () => {
      const message = 'Error: <div onclick="hack()">Click me</div>';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).not.toContain('<div>');
      expect(sanitized).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const message = 'javascript:alert("xss")';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
    });

    it('should preserve safe error messages', () => {
      const message = 'File upload failed: Network error';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe(message);
    });
  });

  describe('isValidStickerRecord', () => {
    it('should accept valid StickerRecord with https URL', () => {
      const record = {
        id: 'test-id',
        imageUrl: 'https://example.com/image.png',
        styleId: 1,
        timestamp: Date.now(),
        sourceImageId: 'source-id',
      };
      expect(isValidStickerRecord(record)).toBe(true);
    });

    it('should accept valid StickerRecord with data URL', () => {
      const record = {
        id: 'test-id',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        styleId: 2,
        timestamp: Date.now(),
      };
      expect(isValidStickerRecord(record)).toBe(true);
    });

    it('should reject non-object inputs', () => {
      expect(isValidStickerRecord(null)).toBe(false);
      expect(isValidStickerRecord(undefined)).toBe(false);
      expect(isValidStickerRecord('string')).toBe(false);
      expect(isValidStickerRecord(123)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const base = { id: 'id', imageUrl: 'https://test.com/img.png', styleId: 1, timestamp: Date.now() };

      const { id, ...noId } = base;
      expect(isValidStickerRecord(noId)).toBe(false);

      const { imageUrl, ...noImageUrl } = base;
      expect(isValidStickerRecord(noImageUrl)).toBe(false);

      const { styleId, ...noStyleId } = base;
      expect(isValidStickerRecord(noStyleId)).toBe(false);

      const { timestamp, ...noTimestamp } = base;
      expect(isValidStickerRecord(noTimestamp)).toBe(false);
    });

    it('should reject empty strings for required fields', () => {
      const record = { id: '', imageUrl: 'https://test.com/img.png', styleId: 1, timestamp: Date.now() };
      expect(isValidStickerRecord(record)).toBe(false);

      const record2 = { id: 'id', imageUrl: '', styleId: 1, timestamp: Date.now() };
      expect(isValidStickerRecord(record2)).toBe(false);
    });

    it('should reject incorrect field types', () => {
      const base = { id: 'id', imageUrl: 'https://test.com/img.png', styleId: 1, timestamp: Date.now() };

      expect(isValidStickerRecord({ ...base, styleId: '1' })).toBe(false);
      expect(isValidStickerRecord({ ...base, timestamp: '12345' })).toBe(false);
      expect(isValidStickerRecord({ ...base, sourceImageId: 123 })).toBe(false);
    });

    it('should reject dangerous URL protocols', () => {
      const base = { id: 'id', styleId: 1, timestamp: Date.now() };

      expect(isValidStickerRecord({ ...base, imageUrl: 'javascript:alert(1)' })).toBe(false);
      expect(isValidStickerRecord({ ...base, imageUrl: 'file:///etc/passwd' })).toBe(false);
      expect(isValidStickerRecord({ ...base, imageUrl: 'ftp://files.com/img.png' })).toBe(false);
    });

    it('should reject malformed data URLs', () => {
      const base = { id: 'id', styleId: 1, timestamp: Date.now() };

      expect(isValidStickerRecord({ ...base, imageUrl: 'data:image/png;base64,invalid!!!' })).toBe(false);
      expect(isValidStickerRecord({ ...base, imageUrl: 'data:text/plain;base64,SGVsbG8=' })).toBe(false);
    });

    it('should reject invalid URL formats', () => {
      const base = { id: 'id', styleId: 1, timestamp: Date.now() };
      expect(isValidStickerRecord({ ...base, imageUrl: 'not-a-url' })).toBe(false);
    });
  });

  describe('validateHistory', () => {
    const validRecord1 = {
      id: '1',
      imageUrl: 'https://test.com/1.png',
      styleId: 1,
      timestamp: 1000,
    };
    const validRecord2 = {
      id: '2',
      imageUrl: 'https://test.com/2.png',
      styleId: 2,
      timestamp: 2000,
    };

    it('should return all valid records in an array', () => {
      const data = [validRecord1, validRecord2];
      const result = validateHistory(data);
      expect(result).toHaveLength(2);
      expect(result).toEqual(data);
    });

    it('should filter out invalid records', () => {
      const invalidRecord = { id: '3', imageUrl: 'javascript:bad' };
      const data = [validRecord1, invalidRecord, validRecord2];
      const result = validateHistory(data);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(validRecord1);
      expect(result).toContainEqual(validRecord2);
    });

    it('should return empty array for non-array inputs', () => {
      expect(validateHistory(null)).toEqual([]);
      expect(validateHistory({})).toEqual([]);
      expect(validateHistory('not an array')).toEqual([]);
    });

    it('should return empty array for empty input array', () => {
      expect(validateHistory([])).toEqual([]);
    });
  });
});
