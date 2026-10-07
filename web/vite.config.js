import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js lives in its own lazily loaded chunk (~1 MB minified, ~270 kB gzip) that is only
    // fetched for the login/register visual, so it is allowed to exceed the default 500 kB warning.
    chunkSizeWarningLimit: 1100,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
