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
    exclude: [
      '**/node_modules/**',
      '**/tests/server.*.test.cjs',
    ],
    projects: [
      {
        test: {
          name: 'server',
          include: ['tests/server.*.test.cjs'],
          environment: 'node',
          globals: true,
        },
      },
    ],
  },
});
