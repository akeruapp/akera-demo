import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Served at the root of the akeru.app custom domain (landing at /, demo at /demo/).
  base: '/',
  plugins: [vue()],
  server: { port: 5173 },
  preview: { port: 4173 },
})
