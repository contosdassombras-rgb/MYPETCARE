import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: true,
  },
  build: {
    // Raise the warning threshold slightly — 774KB gzips to 224KB which is acceptable
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split large vendors into separate chunks for better caching
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation library
          'vendor-motion': ['motion'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // Icons (large)
          'vendor-icons': ['lucide-react'],
          // Pusher Beams (loaded lazily anyway via dynamic import, but separate when bundled)
          'vendor-pusher': ['@pusher/push-notifications-web'],
        },
      },
    },
  },
});
