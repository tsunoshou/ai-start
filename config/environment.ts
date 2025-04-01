import { z } from 'zod';

// 環境変数のスキーマ定義
// eslint-disable-next-line @typescript-eslint/naming-convention
const ENV_SCHEMA = z.object({
  // アプリケーション基本設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_URL: z.string().url().default('http://localhost:3000'),

  // データベース接続設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: z.string().min(1),

  // Supabase設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Auth.js設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AUTH_SECRET: z.string().min(1),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AUTH_URL: z.string().url().default('http://localhost:3000'),

  // 国際化設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DEFAULT_LOCALE: z.string().default('ja'),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPPORTED_LOCALES: z.string().default('ja,en'),

  // OAuth設定（省略可能）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GOOGLE_CLIENT_ID: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GITHUB_CLIENT_ID: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // AI設定（省略可能）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OPENAI_API_KEY: z.string().optional(),

  // ストレージ設定（省略可能）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

// プロセス環境変数の型キャスト
// eslint-disable-next-line @typescript-eslint/naming-convention
const PROCESS_ENV = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NODE_ENV: process.env.NODE_ENV,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_URL: process.env.APP_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: process.env.DATABASE_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AUTH_SECRET: process.env.AUTH_SECRET,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AUTH_URL: process.env.AUTH_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DEFAULT_LOCALE: process.env.DEFAULT_LOCALE,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPPORTED_LOCALES: process.env.SUPPORTED_LOCALES,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
};

// 環境変数の検証と型付け
// eslint-disable-next-line @typescript-eslint/naming-convention
const _ENV = ENV_SCHEMA.safeParse(PROCESS_ENV);

// 検証に失敗した場合はエラーを表示して終了
if (!_ENV.success) {
  console.error('❌ 環境変数の検証に失敗しました：', _ENV.error.format());
  throw new Error('環境変数の検証に失敗しました');
}

// 型安全な環境変数をエクスポート
// eslint-disable-next-line @typescript-eslint/naming-convention
export const ENV = _ENV.data;

// Supabase関連の環境変数のエイリアス
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SUPABASE_KEY = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
