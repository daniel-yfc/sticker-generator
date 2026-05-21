export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
};
