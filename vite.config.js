import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'tinymce': path.resolve(__dirname, 'node_modules/tinymce'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tinymce: ['tinymce'],
        },
      },
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  publicDir: 'public',
});