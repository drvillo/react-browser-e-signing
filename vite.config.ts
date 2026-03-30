import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'demo',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    open: true,
  },
})
