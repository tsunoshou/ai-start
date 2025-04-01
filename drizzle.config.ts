import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// 環境変数をロード
dotenv.config({ path: '.env.local' });

// DATABASE_URL環境変数が設定されていることを確認
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL環境変数が設定されていません。.env.localファイルを確認してください。'
  );
}

export default defineConfig({
  schema: './infrastructure/database/schema/*', // スキーマの場所を更新
  out: './infrastructure/database/migrations', // マイグレーションの出力先を更新
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // マイグレーションのファイル名の接頭辞を日本語にする
  verbose: true,
  strict: true,
});
