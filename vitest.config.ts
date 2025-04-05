import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setupTests.ts', // セットアップファイルのパス (必要に応じて作成)
    exclude: [
      // テスト実行から除外するファイル/ディレクトリ
      'node_modules/',
      'dist/',
      '.next/',
      'coverage/',
      'tests/e2e/**', // E2Eテストディレクトリを除外
    ],
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        // カバレッジ計測から除外するファイル/ディレクトリ
        'node_modules/',
        'dist/',
        '.next/',
        'coverage/',
        '*.config.js',
        '*.config.ts',
        '**/types.ts', // 型定義ファイルを除外
        '**/constants.ts', // 定数ファイルを除外
        'infrastructure/database/migrations/', // マイグレーションファイルを除外
        '**/index.ts', // indexファイルを除外（エクスポートのみの場合が多い）
        // その他、テスト対象外としたいファイルを追記
      ],
    },
  },
});
