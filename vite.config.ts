import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
  plugins: [
    // MUST be before react() — generates route tree before React transform
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src-v4/routes',
      generatedRouteTree: './src-v4/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['oarbit.net'],
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src-v4'),
    },
  },
  build: {
    outDir: 'dist-v4',
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['@tanstack/react-router', '@tanstack/react-query'],
          motion: ['motion/react'],
        },
      },
    },
  },
});
