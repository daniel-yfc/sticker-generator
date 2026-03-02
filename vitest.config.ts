import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    server: {
      deps: {
        inline: ['vitest-canvas-mock']
      }
    },
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
});
