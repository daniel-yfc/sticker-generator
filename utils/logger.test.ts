import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger utility', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have log method', () => {
    expect(logger.log).toBeDefined();
    logger.log('test message');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should have error method', () => {
    expect(logger.error).toBeDefined();
    logger.error('error message');
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should have warn method', () => {
    expect(logger.warn).toBeDefined();
    logger.warn('warning message');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('should have info method', () => {
    expect(logger.info).toBeDefined();
    logger.info('info message');
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should handle multiple arguments', () => {
    logger.log('message', { data: 'value' }, 123);
    expect(consoleSpy.log).toHaveBeenCalledWith('message', { data: 'value' }, 123);
  });

  it('should handle error objects', () => {
    const error = new Error('test error');
    logger.error('Error occurred:', error);
    expect(consoleSpy.error).toHaveBeenCalledWith('Error occurred:', error);
  });
});
