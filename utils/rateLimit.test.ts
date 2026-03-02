import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from './rateLimit';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    limiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000,
      keyPrefix: 'test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should allow requests within limit', () => {
    const result1 = limiter.check('test-op');
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = limiter.check('test-op');
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = limiter.check('test-op');
    expect(result3.allowed).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    limiter.check('test-op');
    limiter.check('test-op');
    limiter.check('test-op');

    const result = limiter.check('test-op');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after time window', () => {
    limiter.check('test-op');
    limiter.check('test-op');
    limiter.check('test-op');

    const blocked = limiter.check('test-op');
    expect(blocked.allowed).toBe(false);

    // Advance time past window
    vi.advanceTimersByTime(1001);

    const allowed = limiter.check('test-op');
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(2);
  });

  it('should track different identifiers separately', () => {
    limiter.check('op-1');
    limiter.check('op-1');
    limiter.check('op-1');

    const blocked = limiter.check('op-1');
    expect(blocked.allowed).toBe(false);

    const allowed = limiter.check('op-2');
    expect(allowed.allowed).toBe(true);
    expect(allowed.remaining).toBe(2);
  });

  it('should reset specific identifier', () => {
    limiter.check('test-op');
    limiter.check('test-op');
    limiter.check('test-op');

    const blocked = limiter.check('test-op');
    expect(blocked.allowed).toBe(false);

    limiter.reset('test-op');

    const allowed = limiter.check('test-op');
    expect(allowed.allowed).toBe(true);
  });

  it('should get status without incrementing', () => {
    limiter.check('test-op');
    limiter.check('test-op');

    const status1 = limiter.getStatus('test-op');
    expect(status1.remaining).toBe(1);

    const status2 = limiter.getStatus('test-op');
    expect(status2.remaining).toBe(1); // Should not change
  });

  it('should handle localStorage failures gracefully', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('Storage full');
    });

    const result = limiter.check('test-op');
    expect(result.allowed).toBe(true); // Fail open

    Storage.prototype.setItem = originalSetItem;
  });
});
