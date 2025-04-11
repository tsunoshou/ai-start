import * as dotenv from 'dotenv';
// import type { Config } from 'drizzle-kit'; // Remove unused import again

// .env.local ファイルが存在する場合に読み込む (CI環境では不要な場合もある)
// パスはプロジェクト構造に合わせて調整してください
try {
  dotenv.config({ path: '.env.local' });
} catch (e) {
  console.warn('.env.local not found, proceeding without it.');
}

// Define the configuration object
const config = {
  schema: './packages/shared/infrastructure/database/schema/index.ts', // スキーマ定義ファイルのパスを修正
  out: './packages/shared/infrastructure/database/migrations', // マイグレーションファイルの出力先を修正
  dialect: 'postgresql', // Specify the dialect
  dbCredentials: {
    // 環境変数 DATABASE_URL を優先的に使用
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
};

// Export the configuration object as the default
export default config;
