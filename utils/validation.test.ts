import { describe, it, expect } from 'vitest';
import {
  isAllowedMimeType,
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
  describe('isAllowedMimeType', () => {
    it('should return true for all allowed MIME types', () => {
      ALLOWED_MIME_TYPES.forEach((type) => {
        expect(isAllowedMimeType(type)).toBe(true);
      });
    });

    it('should return false for unsupported MIME types', () => {
      const unsupported = ['image/gif', 'application/pdf', 'text/plain', 'image/bmp'];
      unsupported.forEach((type) => {
        expect(isAllowedMimeType(type)).toBe(false);
      });
    });

    it('should return false for empty string', () => {
      expect(isAllowedMimeType('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isAllowedMimeType('IMAGE/PNG')).toBe(false);
    });
  });

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
      expect(result).toEqual({
        valid: false,
        error: 'Invalid JSON data'
      });
    });

    it('should reject data exceeding size limit', () => {
      const largeData = JSON.stringify({ data: new Array(6 * 1024 * 1024).fill('a') });
      const result = validateLocalStorageData('test', largeData);
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should escape script tags', () => {
      const message = 'Error: <script>alert("xss")</script>Something went wrong';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('&quot;xss&quot;');
      expect(sanitized).not.toContain('<script>');
    });

    it('should handle script tags with newlines', () => {
      const message = 'Error: <script>\nalert("xss")\n</script>Something went wrong';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).not.toContain('<script>');
    });

    it('should escape HTML tags', () => {
      const message = 'Error: <div onclick="hack()">Click me</div>';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toContain('&lt;div');
      expect(sanitized).toContain('onclick=&quot;hack()&quot;');
      expect(sanitized).not.toContain('<div');
    });

    it('should preserve content but escape tags in attribute-based attacks', () => {
      const message = '<img src=x onerror=alert(1)>';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe('&lt;img src=x onerror=alert(1)&gt;');
    });

    it('should handle dangerous protocols (though escaping handles this if in tags)', () => {
      const message = 'javascript:alert("xss")';
      const sanitized = sanitizeErrorMessage(message);
      // Since it's not a tag, it's just escaped for quotes
      expect(sanitized).toBe('javascript:alert(&quot;xss&quot;)');
    });

    it('should handle mixed case tags', () => {
      const message = '<sCrIpT>alert(1)</sCrIpT>';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toContain('&lt;sCrIpT&gt;');
      expect(sanitized).not.toContain('<sCrIpT>');
    });

    it('should preserve safe error messages', () => {
      const message = 'File upload failed: Network error';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe(message);
    });

    it('should handle empty input gracefully', () => {
      expect(sanitizeErrorMessage('')).toBe('');
    });

    it('should escape all special characters', () => {
      const message = 'Error & failure < > " \'';
      const sanitized = sanitizeErrorMessage(message);
      expect(sanitized).toBe('Error &amp; failure &lt; &gt; &quot; &#039;');
    });
  });

  describe('isValidStickerRecord', () => {
    const validRecord = {
      id: 'sticker-1',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      styleId: 1,
      timestamp: Date.now(),
    };

    it('should return true for valid record with data URL', () => {
      expect(isValidStickerRecord(validRecord)).toBe(true);
    });

    it('should return true for valid record with http/https URL', () => {
      const webRecord = { ...validRecord, imageUrl: 'https://example.com/image.png' };
      expect(isValidStickerRecord(webRecord)).toBe(true);
    });

    it('should return true for valid record with sourceImageId', () => {
      const extendedRecord = { ...validRecord, sourceImageId: 'source-1' };
      expect(isValidStickerRecord(extendedRecord)).toBe(true);
    });

    it('should return false for missing or invalid id', () => {
      expect(isValidStickerRecord({ ...validRecord, id: undefined })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, id: '' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, id: 123 })).toBe(false);
    });

    it('should return false for missing or invalid imageUrl', () => {
      expect(isValidStickerRecord({ ...validRecord, imageUrl: undefined })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: '' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'invalid-url' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'javascript:alert(1)' })).toBe(false);
    });

    it('should return false for invalid data URL', () => {
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'data:text/plain;base64,YWFh' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'data:image/png;base64,invalid!chars' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'data:image/png;base64,YWFh===' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'data:image/png;base64, ' })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, imageUrl: 'data:image/png;base64,<script>alert(1)</script>' })).toBe(false);
    });

    it('should return false for missing or invalid styleId', () => {
      expect(isValidStickerRecord({ ...validRecord, styleId: undefined })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, styleId: '1' })).toBe(false);
    });

    it('should return false for missing or invalid timestamp', () => {
      expect(isValidStickerRecord({ ...validRecord, timestamp: undefined })).toBe(false);
      expect(isValidStickerRecord({ ...validRecord, timestamp: '2023-01-01' })).toBe(false);
    });

    it('should return false for invalid sourceImageId type', () => {
      expect(isValidStickerRecord({ ...validRecord, sourceImageId: 123 })).toBe(false);
    });

    it('should return false for null or non-object input', () => {
      expect(isValidStickerRecord(null)).toBe(false);
      expect(isValidStickerRecord('not an object')).toBe(false);
    });
  });

  describe('validateHistory', () => {
    const validRecord1 = {
      id: '1',
      imageUrl: 'https://example.com/1.png',
      styleId: 1,
      timestamp: 1000,
    };
    const validRecord2 = {
      id: '2',
      imageUrl: 'https://example.com/2.png',
      styleId: 2,
      timestamp: 2000,
    };
    const invalidRecord = {
      id: '3',
      imageUrl: 'javascript:alert(1)',
      styleId: 3,
      timestamp: 3000,
    };

    it('should return all items when all are valid', () => {
      const history = [validRecord1, validRecord2];
      const validated = validateHistory(history);
      expect(validated).toHaveLength(2);
      expect(validated).toEqual(history);
    });

    it('should filter out invalid items', () => {
      const history = [validRecord1, invalidRecord, validRecord2];
      const validated = validateHistory(history);
      expect(validated).toHaveLength(2);
      expect(validated).toContainEqual(validRecord1);
      expect(validated).toContainEqual(validRecord2);
      expect(validated).not.toContainEqual(invalidRecord);
    });

    it('should return empty array for non-array input', () => {
      expect(validateHistory(null)).toEqual([]);
      expect(validateHistory({})).toEqual([]);
      expect(validateHistory('not an array')).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(validateHistory([])).toEqual([]);
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
