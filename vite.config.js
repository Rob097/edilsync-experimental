import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  optimizeDeps: {
    entries: ['index.html'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@i18n': path.resolve(__dirname, './i18n'),
    },
  },
  plugins: [
    react(),
  ]
});