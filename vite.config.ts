import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: ['es2020', 'safari14', 'ios14'],
      cssTarget: ['safari14', 'ios14'],
    },
    server: {
      // HMR is controlled via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Optimize file watching in production/CI environments.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
