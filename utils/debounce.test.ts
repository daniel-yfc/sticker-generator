import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should reset delay on subsequent calls', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc();
    vi.advanceTimersByTime(100);
    debouncedFunc();
    vi.advanceTimersByTime(100);
    debouncedFunc();

    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments correctly', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc('arg1', 'arg2', 123);
    vi.advanceTimersByTime(300);

    expect(func).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should handle multiple different arguments', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 300);

    debouncedFunc('first');
    vi.advanceTimersByTime(100);
    debouncedFunc('second');
    vi.advanceTimersByTime(300);

    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('second');
  });
});
