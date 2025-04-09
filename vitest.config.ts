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
        // カバレッジ計測から除外するファイル/ディレクトリ (既存 + 追加)
        '**/node_modules/**', // node_modules全体
        '**/dist/**', // ビルド出力
        '**/.next/**', // Next.jsビルド関連
        '**/coverage/**', // カバレッジレポート自体
        '**/.*/**', // .git, .vscodeなどの隠しディレクトリ内の全て
        '**/.*', // ルートの隠しファイル (.eslintrc.js など)
        '*.config.js',
        '*.config.ts',
        '*.config.mjs',
        '*.cjs',
        '*.js', // ルートの .js ファイル
        '*.mjs', // ルートの .mjs ファイル
        'middleware.ts',
        'vitest.workspace.ts', // ワークスペース設定ファイル
        '**/*.d.ts', // 全ての型定義ファイル

        // Storybook関連
        '.storybook/**',
        'stories/**',
        'storybook-static/**',

        // UIコンポーネント (Shadcn UIなど)
        'presentation/components/ui/**',

        // Next.js App Router pages/layout
        'app/layout.tsx',
        'app/page.tsx',

        // テストファイル自体
        '**/*.test.ts',
        '**/__tests__/**',
        'tests/**', // tests ディレクトリ全体 (setupなど含む)

        // その他
        'i18n/**',
        'config/**',
        'infrastructure/database/utils/**',
        'infrastructure/database/schema/**', // スキーマ定義
        'shared/types/**', // 共有型定義
        'shared/enums/**', // 共有Enum
        'domain/models/**/**.enum.ts', // ドメインEnum
        '**/index.ts', // エクスポートのみの index.ts
        'next-env.d.ts',
        'vitest.shims.d.ts',

        // 型のみ、定数のみ、インターフェースのみのファイル (必要に応じてパターン調整)
        '**/types.ts',
        '**/constants.ts',
        '**/interface.ts',
      ],
      // 計測対象を明示的に指定 (より厳密にする場合)
      // include: [
      //   'domain/**',
      //   'application/**',
      //   'shared/utils/**', // utilsは含める
      //   'shared/value-objects/**', // VOは含める
      //   'shared/errors/**', // エラーは含める
      //   'infrastructure/mappers/**', // マッパーは含める
      //   'infrastructure/repositories/**', // リポジトリは含める (DB除く場合あり)
      //   'infrastructure/ai/**', // AIサービスは含める
      //   'app/api/**' // APIルート含める
      // ],
      all: true, // include/exclude に基づいてカバレッジを計算
    },
  },
});
