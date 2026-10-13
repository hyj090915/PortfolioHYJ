import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // three.js 는 크고 거의 안 바뀌니까 따로 떼서 캐시되게
        manualChunks: { three: ['three'] },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
