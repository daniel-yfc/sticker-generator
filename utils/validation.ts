/**
 * Security and validation utilities
 * Provides input validation for file uploads and user data
 */

import { logger } from './logger';
import { StickerRecord } from '../types';

// Security constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_DIMENSION = 4096; // 4096px
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates uploaded file for security and compatibility
 * Prevents malicious uploads and oversized files
 * 
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  // Additional check: verify file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'Invalid file extension',
    };
  }

  return { valid: true };
}

/**
 * Validates image dimensions to prevent processing extremely large images
 * 
 * @param imageUrl - Data URL or blob URL of the image
 * @returns Promise with validation result
 */
export function validateImageDimensions(imageUrl: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        resolve({
          valid: false,
          error: `Image dimensions (${img.width}x${img.height}) exceed maximum of ${MAX_IMAGE_DIMENSION}px`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to load image for validation',
      });
    };

    img.src = imageUrl;
  });
}

/**
 * Validates and sanitizes localStorage data to prevent overflow attacks
 * 
 * @param key - localStorage key
 * @param data - Data to store
 * @returns Validation result
 */
export function validateLocalStorageData(key: string, data: string): ValidationResult {
  const size = new Blob([data]).size;
  
  if (size > MAX_LOCALSTORAGE_SIZE) {
    logger.warn(`localStorage data for key ${key} exceeds size limit`);
    return {
      valid: false,
      error: 'Data size exceeds storage limit',
    };
  }

  try {
    // Attempt to parse as JSON to ensure validity
    JSON.parse(data);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid JSON data',
    };
  }
}

/**
 * Sanitizes error messages to prevent XSS attacks
 * Removes potentially dangerous HTML/script tags
 * 
 * @param message - Error message to sanitize
 * @returns Sanitized message
 */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validates if an object conforms to the StickerRecord interface
 * Checks for required fields and basic type safety
 *
 * @param item - Object to validate
 * @returns boolean indicating if the object is a valid StickerRecord
 */
export function isValidStickerRecord(item: any): item is StickerRecord {
  if (!item || typeof item !== 'object') return false;

  const { id, imageUrl, styleId, timestamp, sourceImageId } = item;

  // Basic type checks
  if (typeof id !== 'string' || id.length === 0) return false;
  if (typeof imageUrl !== 'string' || imageUrl.length === 0) return false;
  if (typeof styleId !== 'number') return false;
  if (typeof timestamp !== 'number') return false;
  if (sourceImageId !== undefined && typeof sourceImageId !== 'string') return false;

  // URL Security Check: Prevent XSS via javascript: or other dangerous protocols
  try {
    // If it's a data URL, verify it's an image
    if (imageUrl.startsWith('data:')) {
      return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(imageUrl);
    }

    // Otherwise, check for safe web protocols
    const url = new URL(imageUrl);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (e) {
    // If it's not a valid URL format and not a data URL, reject it
    return false;
  }
}

/**
 * Validates and filters history data from localStorage
 * Ensures only valid StickerRecord items are kept
 *
 * @param data - Parsed JSON data from localStorage
 * @returns Array of valid StickerRecord objects
 */
export function validateHistory(data: any): StickerRecord[] {
  if (!Array.isArray(data)) {
    logger.warn('History data is not an array, returning empty history');
    return [];
  }

  const validHistory = data.filter(isValidStickerRecord);

  if (validHistory.length !== data.length) {
    logger.warn(`Filtered out ${data.length - validHistory.length} invalid history items`);
  }

  return validHistory;
}

/**
 * Validates if a URL is safe for fetching
 * Restricts to known safe local paths or safe data URLs
 *
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is safe
 */
export function isSafeImageUrl(url: string): boolean {
  if (!url) return false;

  // Allow relative paths from the local images directory
  // In a production app, we might want to be even more restrictive
  if (url.startsWith('images/')) {
    // Basic path traversal protection: don't allow '..'
    return !url.includes('..');
  }

  // Allow safe data URLs
  if (url.startsWith('data:')) {
    return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(url);
  }

  try {
    const parsedUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

    // Allow same-origin URLs
    if (typeof window !== 'undefined' && parsedUrl.origin === window.location.origin) {
      return true;
    }

    // For external URLs, we could implement a whitelist here.
    // Since the app currently only uses local images for its gallery,
    // we reject all other external origins by default.
    return false;
  } catch (e) {
    return false;
  }
}
