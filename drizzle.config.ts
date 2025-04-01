import path from 'path';

import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// 環境変数をロード
// 開発環境では.env.localファイルを使用
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// DATABASE_URL環境変数が設定されていることを確認
// 注意: 実行時の環境変数が優先されます
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL環境変数が設定されていません。.env.localファイルまたは環境変数を確認してください。'
  );
}

// Drizzle Kit設定をエクスポート
export default defineConfig({
  schema: './infrastructure/database/schema/*', // スキーマの場所
  out: './infrastructure/database/migrations', // マイグレーションの出力先
  dialect: 'postgresql', // データベースの種類
  dbCredentials: {
    url: DATABASE_URL, // 環境変数から接続文字列を取得
  },
  // マイグレーションの設定
  verbose: true, // 詳細なログを出力
  strict: true, // 厳格モードを有効化
});
