import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' so the build works under any sub-path (GitHub Pages: /theogg06/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1200 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
