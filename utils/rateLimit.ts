/**
 * Rate limiting utility to prevent API abuse
 * Implements token bucket algorithm for smooth rate limiting
 */

import { logger } from './logger';

export interface RateLimitConfig {
  maxRequests: number;  // Maximum number of requests
  windowMs: number;      // Time window in milliseconds
  keyPrefix?: string;    // Prefix for storage keys
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// CO4-002: in-memory fallback for when localStorage is unavailable
// (QuotaExceededError, Safari ITP private mode, disabled storage).
// Keyed by the same string used for localStorage so semantics are identical.
const fallbackMap = new Map<string, { count: number; windowStart: number }>();

/**
 * Rate limiter class using token bucket algorithm
 * Prevents excessive API calls and protects against abuse
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private storageKey: string;

  constructor(config: RateLimitConfig) {
    if (config.maxRequests <= 0) {
      throw new Error('maxRequests must be positive');
    }
    if (config.windowMs <= 0) {
      throw new Error('windowMs must be positive');
    }
    this.config = {
      keyPrefix: 'rate_limit',
      ...config,
    };
    this.storageKey = `${this.config.keyPrefix}_${Date.now()}`;
  }

  /**
   * Checks if request is allowed under rate limit
   * Updates token count and timestamps
   *
   * @param identifier - Unique identifier for the rate limit (e.g., 'generate_sticker')
   * @returns Rate limit result
   */
  check(identifier: string): RateLimitResult {
    const key = `${this.config.keyPrefix}_${identifier}`;
    const now = Date.now();

    try {
      const stored = localStorage.getItem(key);
      let data = stored ? JSON.parse(stored) : null;

      // Initialize or reset if window expired
      if (!data || now - data.windowStart >= this.config.windowMs) {
        data = {
          count: 0,
          windowStart: now,
        };
      }

      const remaining = this.config.maxRequests - data.count;
      const resetTime = data.windowStart + this.config.windowMs;

      if (data.count >= this.config.maxRequests) {
        logger.warn(`Rate limit exceeded for ${identifier}`);
        return { allowed: false, remaining: 0, resetTime };
      }

      data.count++;
      localStorage.setItem(key, JSON.stringify(data));

      return { allowed: true, remaining: remaining - 1, resetTime };
    } catch {
      return this._fallbackCheck(key, now);
    }
  }

  /**
   * Resets rate limit for a specific identifier
   * Useful for testing or manual resets
   *
   * @param identifier - Identifier to reset
   */
  reset(identifier: string): void {
    const key = `${this.config.keyPrefix}_${identifier}`;
    try {
      localStorage.removeItem(key);
      logger.info(`Rate limit reset for ${identifier}`);
    } catch {
      fallbackMap.delete(key);
      logger.warn(`Rate limit reset via in-memory fallback for ${identifier}`);
    }
  }

  /**
   * Gets current rate limit status without incrementing
   *
   * @param identifier - Identifier to check
   * @returns Current rate limit status
   */
  getStatus(identifier: string): RateLimitResult {
    const key = `${this.config.keyPrefix}_${identifier}`;
    const now = Date.now();

    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
        };
      }

      const data = JSON.parse(stored);

      if (now - data.windowStart >= this.config.windowMs) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
        };
      }

      const remaining = this.config.maxRequests - data.count;
      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        resetTime: data.windowStart + this.config.windowMs,
      };
    } catch {
      const entry = fallbackMap.get(key);
      if (!entry || now - entry.windowStart >= this.config.windowMs) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
        };
      }
      const remaining = this.config.maxRequests - entry.count;
      return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        resetTime: entry.windowStart + this.config.windowMs,
      };
    }
  }

  // CO4-002: in-memory rate check used when localStorage is unavailable.
  // Logs a warn on first use to record the degradation event.
  private _fallbackCheck(key: string, now: number): RateLimitResult {
    logger.warn(`Rate limiter degraded to in-memory fallback for key: ${key}`);

    let entry = fallbackMap.get(key);
    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      entry = { count: 0, windowStart: now };
      fallbackMap.set(key, entry);
    }

    const resetTime = entry.windowStart + this.config.windowMs;
    const remaining = this.config.maxRequests - entry.count;

    if (entry.count >= this.config.maxRequests) {
      logger.warn(`Rate limit exceeded (in-memory fallback) for key: ${key}`);
      return { allowed: false, remaining: 0, resetTime };
    }

    entry.count++;
    return { allowed: true, remaining: remaining - 1, resetTime };
  }
}

// Default rate limiters for common operations
export const stickerGenerationLimiter = new RateLimiter({
  maxRequests: 10,    // 10 requests
  windowMs: 60000,    // per minute
  keyPrefix: 'sticker_gen',
});
