/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode: _mode }) => {
    return {
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
            changeOrigin: true,
          }
        }
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
