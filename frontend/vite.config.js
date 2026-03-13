import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'





// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');

          if (normalized.includes('/node_modules/')) {
            if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/react-router') || normalized.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (normalized.includes('/recharts/')) {
              return 'vendor-charts';
            }
            if (normalized.includes('/axios/')) {
              return 'vendor-http';
            }
            if (normalized.includes('/lucide-react/') || normalized.includes('/react-icons/')) {
              return 'vendor-icons';
            }
            return 'vendor-misc';
          }
          return undefined;
        },
      },
    },
  },
})
