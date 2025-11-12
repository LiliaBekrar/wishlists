import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⬅️ Base URL uniquement en production (GitHub Pages)
  base: process.env.NODE_ENV === 'production' ? '/wishlists/' : '/',
})
