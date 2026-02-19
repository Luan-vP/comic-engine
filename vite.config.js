import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sceneExporter from './vite-plugin-scene-exporter.js';

export default defineConfig({
  plugins: [react(), sceneExporter()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5666',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
