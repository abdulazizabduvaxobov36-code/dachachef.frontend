import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', '@emotion/react', '@emotion/styled', '@babel/runtime/helpers/extends'],
  },
  server: {
    allowedHosts: 'all',
    host: true,
    proxy: {
      '/orders': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/reviews': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/chefs': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/customers': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/auth': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/posts': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/online': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/chats': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
      '/unread': { target: 'http://localhost:5001', changeOrigin: true, configure: p => p.on('error', () => { }) },
    }
  }
});