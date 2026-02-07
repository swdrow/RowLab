import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: ['rowlab.net'],
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
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@v2': path.resolve(__dirname, './src/v2'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // State management and data fetching
          'query-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-table',
            '@tanstack/react-virtual',
          ],
          // Forms
          'forms-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // UI libraries
          'ui-vendor': ['@headlessui/react', 'sonner'],
          // 3D rendering (large chunk, load separately)
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Animation library
          'animation-vendor': ['framer-motion'],
          // Charting
          'chart-vendor': ['recharts'],
          // Drag and drop
          'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // PDF/Export
          'export-vendor': ['jspdf', 'html2canvas'],
          // Icons
          'icons-vendor': ['@phosphor-icons/react', 'lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit (Three.js is large)
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', 'framer-motion'],
  },
});
