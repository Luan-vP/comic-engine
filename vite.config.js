import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  server: {
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
    alias: [
      {
        find: /^.*\.(png|jpg|jpeg|gif|svg|webp|avif)(\?.*)?$/,
        replacement: fileURLToPath(new URL('./src/__mocks__/fileMock.js', import.meta.url)),
      },
    ],
  },
})
