import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Dev server: proxy /api to the Express backend
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  // Production build output
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
