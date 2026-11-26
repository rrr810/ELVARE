import { env } from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: env.VITE_BASE_PATH?.trim() ? (env.VITE_BASE_PATH.trim().endsWith('/') ? env.VITE_BASE_PATH.trim() : `${env.VITE_BASE_PATH.trim()}/`) : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@supabase/')) return 'supabase';
          if (id.includes('/node_modules/react-router')) return 'router';
          if (id.includes('/node_modules/lucide-react/')) return 'icons';
        },
      },
    },
  },
});
