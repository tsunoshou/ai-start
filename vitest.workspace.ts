import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin';
import { defineWorkspace } from 'vitest/config';

const DIR_NAME =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/writing-tests/test-addon
export default defineWorkspace([
  // 'vitest.config.ts', // ルートの設定はextendsで読み込む方が推奨
  'apps/*/vitest.config.ts',
  'packages/*/vitest.config.ts',
  {
    // extends: './vitest.config.ts', // ルート設定を継承する場合
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/writing-tests/test-addon#storybooktest
      storybookTest({ configDir: path.join(DIR_NAME, '.storybook') }),
    ],
    test: {
      name: 'storybook',
      include: ['**/*.stories.?(m)jsx', '**/*.stories.?(m)tsx'], // Storybookテスト対象 (tsxも追加)
      browser: {
        enabled: true,
        headless: true,
        provider: 'playwright',
        // instances: [{ browser: 'chromium' }], // 必要に応じてブラウザ指定
      },
      // setupFiles: ['.storybook/vitest.setup.ts'], // Storybook固有セットアップ
    },
  },
]);
