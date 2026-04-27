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
      // Docker Desktop + Windows の bind mount は inotify イベントがホスト→コンテナに
      // 伝わらず HMR が動かないため polling が必須。
      // interval を短くすると CPU 飽和 → HTML 応答秒単位遅延の副作用あり。
      // 折り合い: 1000ms （保存後 1〜2 秒で反映、CPU は許容範囲）。
      // ignored で node_modules や生成物を外し、polling 対象を src/ + 設定ファイルのみに絞る。
      usePolling: true,
      interval: 5000,
      binaryInterval: 10000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.emulator-data/**',
        '**/dist/**',
        '**/.firebase/**',
        '**/coverage/**',
        '**/.vite/**',
        '**/design-reference/**',
        '**/docker/**',
        '**/.claude/**',
      ],
    },
    hmr: {
      // HMR の WebSocket もホストポート 3200 経由で繋がるよう明示
      clientPort: 3200,
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
