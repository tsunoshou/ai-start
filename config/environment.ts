import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  // アプリケーション基本設定
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  
  // データベース接続設定
  DATABASE_URL: z.string().min(1),
  
  // Supabase設定
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  
  // Auth.js設定
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().default('http://localhost:3000'),
  
  // OAuth設定（省略可能）
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  
  // AI設定（省略可能）
  OPENAI_API_KEY: z.string().optional(),
  
  // ストレージ設定（省略可能）
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

// プロセス環境変数の型キャスト
const processEnv = {
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
};

// 環境変数の検証と型付け
const _env = envSchema.safeParse(processEnv);

// 検証に失敗した場合はエラーを表示して終了
if (!_env.success) {
  console.error(
    '❌ 環境変数の検証に失敗しました：',
    _env.error.format(),
  );
  throw new Error('環境変数の検証に失敗しました');
}

// 型安全な環境変数をエクスポート
export const env = _env.data; 