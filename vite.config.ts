import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      // Docker Desktop (WSL2) では bind mount に対する inotify が動くので polling 不要。
      // 旧 Hyper-V backend では usePolling: true が必要だった経緯あり。
      // node_modules は監視対象外（HMR 不要、CPU 削減）。
      ignored: ['**/node_modules/**', '**/.git/**', '**/.emulator-data/**', '**/dist/**'],
    },
  },
  optimizeDeps: {
    // Firebase SDK の prebundle で connectAuthEmulator が握り潰される問題を回避
    exclude: ['firebase'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        },
      },
    },
  },
});
