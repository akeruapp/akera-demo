import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Served at https://macshivadi.github.io/aketa-demo/ for now.
  // When the akeru.app custom domain is attached, change base to '/' (site at akeru.app/, demo at akeru.app/demo/).
  base: '/aketa-demo/',
  plugins: [vue()],
  server: { port: 5173 },
  preview: { port: 4173 },
})
