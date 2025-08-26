import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false // Allow Vite to try other ports if 5173 is busy
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'video-player': path.resolve(__dirname, 'video-player.html')
      }
    }
  },
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false // Allow Vite to try other ports if 5173 is busy
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});