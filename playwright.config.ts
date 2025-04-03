import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e', // E2Eテストファイルのディレクトリ
  fullyParallel: true, // 並列実行を有効化
  forbidOnly: !!process.env.CI, // CI環境では .only を禁止
  retries: process.env.CI ? 2 : 0, // CI環境ではリトライを2回実行
  workers: process.env.CI ? 1 : undefined, // CI環境ではワーカー数を1に制限
  reporter: 'html', // レポート形式
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000', // テスト対象のベースURL
    trace: 'on-first-retry', // 最初のリトライ時にトレースを記録
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* モバイルテストが必要な場合
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],
  /* Webサーバーを自動起動する場合 */
  webServer: {
    command: 'npm run start', // サーバー起動コマンド (必要に応じて変更)
    url: 'http://localhost:3000', // サーバーが起動するURL
    reuseExistingServer: !process.env.CI, // CI環境以外では既存サーバーを再利用
    timeout: 120 * 1000, // サーバー起動のタイムアウト (ミリ秒)
    stdout: 'pipe', // stdoutをパイプしてログを確認可能に
    stderr: 'pipe', // stderrをパイプ
  },
});
