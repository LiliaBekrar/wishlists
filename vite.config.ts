import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/wishlists/', // ⬅️ remplace par le nom de ton repo
})
