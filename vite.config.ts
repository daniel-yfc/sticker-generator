import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, '.', '');

    // SECURITY FIX: Only inject the API key during local development ('serve' command)
    // In production builds, this ensures the key is not baked into the client bundle
    const shouldInjectApiKey = command === 'serve';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': shouldInjectApiKey ? JSON.stringify(env.GEMINI_API_KEY || '') : 'undefined',
        'process.env.GEMINI_API_KEY': shouldInjectApiKey ? JSON.stringify(env.GEMINI_API_KEY || '') : 'undefined'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
