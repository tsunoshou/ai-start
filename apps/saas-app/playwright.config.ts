import { defineConfig, devices } from '@playwright/test';

// webServerの設定を条件付きで定義
const WEB_SERVER_CONFIG = process.env.PLAYWRIGHT_BASE_URL
  ? undefined // PLAYWRIGHT_BASE_URL があれば webServer を無効化
  : {
      command: 'npm run dev --filter=saas-app', // Turborepo経由でsaas-appを起動
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
    };

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
    extraHTTPHeaders: {
      // Vercel のパスワード保護をバイパスするためのヘッダー
      ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      }),
      // 他に必要な共通ヘッダーがあればここに追加
    },
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
  // 条件付きで webServer を設定
  webServer: WEB_SERVER_CONFIG,
});
