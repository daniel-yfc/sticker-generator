/**
 * Security and validation utilities
 * Provides input validation for file uploads and user data
 */

import { logger } from './logger';

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
