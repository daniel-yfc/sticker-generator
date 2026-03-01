const isDev = () => {
  try {
    // @ts-ignore
    if (import.meta.env && import.meta.env.DEV) {
      return true;
    }
  } catch (error: unknown) {
    // ignore
  }
  return process.env.NODE_ENV !== 'production';
};

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev()) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev()) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev()) {
      console.info(...args);
    }
  },
  log: (...args: unknown[]) => {
    if (isDev()) {
      console.log(...args);
    }
  }
};
