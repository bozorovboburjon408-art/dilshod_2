import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  build: {
    target: 'es2022', chunkSizeWarningLimit: 1500,
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), studio: resolve(__dirname, 'studio.html') } },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
