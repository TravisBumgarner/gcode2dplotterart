import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * In production the plotter server serves this build itself, so the API is
 * same-origin and none of this applies. `vite dev` is the odd case: the page
 * comes from :5173 and the server is elsewhere, so proxy the two paths it owns.
 * `PLOTTER_SERVER` points the proxy at a Pi on the LAN instead of localhost.
 */
const target = process.env.PLOTTER_SERVER ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target, changeOrigin: true },
      '/ws': { target, ws: true, changeOrigin: true },
    },
  },
});
