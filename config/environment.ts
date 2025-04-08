import 'reflect-metadata';
import { config } from 'dotenv';
import { container } from 'tsyringe';
import { z } from 'zod';

import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

// .env ファイルを読み込む
config();

// 環境変数のスキーマ定義
// eslint-disable-next-line @typescript-eslint/naming-convention
const ENV_SCHEMA = z.object({
  // アプリケーション基本設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_URL: z.string().url().default('http://localhost:3000'),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_ENV: z.enum(['local', 'development', 'staging', 'production']).default('local'),

  // データベース接続設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: z.string().min(1),
  // 環境別データベース接続設定（オプション）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_DEVELOPMENT: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_STAGING: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_PRODUCTION: z.string().optional(),

  // Supabase設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // 環境別Supabase設定（オプション）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT: z.string().url().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_STAGING: z.string().url().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_STAGING: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_PRODUCTION: z.string().url().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_PRODUCTION: z.string().optional(),

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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ANTHROPIC_API_KEY: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GEMINI_API_KEY: z.string().optional(),

  // ストレージ設定（省略可能）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // ログ設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// 環境変数の型を定義
type EnvironmentVariables = z.infer<typeof ENV_SCHEMA>;

// プロセス環境変数の型キャスト
// eslint-disable-next-line @typescript-eslint/naming-convention
const PROCESS_ENV = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NODE_ENV: process.env.NODE_ENV,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_URL: process.env.APP_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  APP_ENV: process.env.APP_ENV,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL: process.env.DATABASE_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_DEVELOPMENT: process.env.DATABASE_URL_DEVELOPMENT,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_STAGING: process.env.DATABASE_URL_STAGING,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  DATABASE_URL_PRODUCTION: process.env.DATABASE_URL_PRODUCTION,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // 環境別Supabase設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT: process.env.NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT: process.env.SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_STAGING: process.env.NEXT_PUBLIC_SUPABASE_URL_STAGING,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_STAGING: process.env.SUPABASE_SERVICE_ROLE_KEY_STAGING,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_URL_PRODUCTION: process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SUPABASE_SERVICE_ROLE_KEY_PRODUCTION: process.env.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION,
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
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LOG_LEVEL: process.env.LOG_LEVEL,
};

// 環境変数の検証と型付け
// eslint-disable-next-line @typescript-eslint/naming-convention
const _ENV = ENV_SCHEMA.safeParse(PROCESS_ENV);

// クライアントサイドとサーバーサイドで異なる検証ハンドリング
// eslint-disable-next-line @typescript-eslint/naming-convention
let ENV: EnvironmentVariables;

if (typeof window === 'undefined') {
  // サーバーサイドでは厳格な検証を行う
  if (!_ENV.success) {
    console.error('❌ 環境変数の検証に失敗しました：', _ENV.error.format());
    throw new Error('環境変数の検証に失敗しました');
  }
  ENV = _ENV.data;
} else {
  // クライアントサイドでは利用可能な環境変数のみで処理を続行
  // NEXT_PUBLIC_で始まる変数のみクライアントで利用可能
  if (!_ENV.success) {
    console.warn('⚠️ いくつかの環境変数が不足しています（クライアントサイド）');
    // デフォルト値でフォールバック
    /* eslint-disable @typescript-eslint/naming-convention */
    const defaultValues: EnvironmentVariables = {
      // 基本設定
      NODE_ENV:
        process.env.NODE_ENV === 'production'
          ? 'production'
          : process.env.NODE_ENV === 'test'
            ? 'test'
            : 'development',
      APP_ENV:
        process.env.APP_ENV === 'production'
          ? 'production'
          : process.env.APP_ENV === 'staging'
            ? 'staging'
            : process.env.APP_ENV === 'development'
              ? 'development'
              : 'local',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

      // Supabase関連（クライアントで使用可能な変数）
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',

      // 国際化設定
      DEFAULT_LOCALE: 'ja',
      SUPPORTED_LOCALES: 'ja,en',
      LOG_LEVEL:
        process.env.LOG_LEVEL === 'debug'
          ? 'debug'
          : process.env.LOG_LEVEL === 'warn'
            ? 'warn'
            : process.env.LOG_LEVEL === 'error'
              ? 'error'
              : 'info',

      // Auth.js設定
      AUTH_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

      // サーバーサイドのみで使用する変数は空値やundefinedで初期化
      DATABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      AUTH_SECRET: '',

      // 残りの任意パラメータはundefinedで初期化
      DATABASE_URL_DEVELOPMENT: undefined,
      DATABASE_URL_STAGING: undefined,
      DATABASE_URL_PRODUCTION: undefined,
      NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT: undefined,
      SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT: undefined,
      NEXT_PUBLIC_SUPABASE_URL_STAGING: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING: undefined,
      SUPABASE_SERVICE_ROLE_KEY_STAGING: undefined,
      NEXT_PUBLIC_SUPABASE_URL_PRODUCTION: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION: undefined,
      SUPABASE_SERVICE_ROLE_KEY_PRODUCTION: undefined,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      GITHUB_CLIENT_ID: undefined,
      GITHUB_CLIENT_SECRET: undefined,
      OPENAI_API_KEY: undefined,
      ANTHROPIC_API_KEY: undefined,
      GEMINI_API_KEY: undefined,
      BLOB_READ_WRITE_TOKEN: undefined,
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    ENV = defaultValues;
  } else {
    ENV = _ENV.data;
  }
}

// 型安全な環境変数をエクスポート
// eslint-disable-next-line @typescript-eslint/naming-convention
export { ENV };

// Supabase関連の環境変数のエイリアス
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const SUPABASE_KEY = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 現在の環境に基づいて適切なデータベースURLを取得
 * @returns 環境に対応するデータベースURL
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getDatabaseUrl = (): string => {
  // 環境に応じた接続文字列を取得
  const envSpecificUrl = (() => {
    switch (ENV.APP_ENV) {
      case 'production':
        return ENV.DATABASE_URL_PRODUCTION;
      case 'staging':
        return ENV.DATABASE_URL_STAGING;
      case 'development':
        return ENV.DATABASE_URL_DEVELOPMENT;
      default:
        return null;
    }
  })();

  // 接続プーラー形式かどうかを確認
  const isPoolerUrl = (url: string): boolean => {
    return url.includes('pooler.supabase.com') || url.includes('pgbouncer=true');
  };

  // 利用可能なURLからプーラー接続を優先
  if (envSpecificUrl) {
    if (isPoolerUrl(envSpecificUrl)) {
      logger.info(`${ENV.APP_ENV}環境用の接続プーラーを使用します`);
      return envSpecificUrl;
    }

    logger.info(`${ENV.APP_ENV}環境用の直接接続を使用します`);
    return envSpecificUrl;
  }

  // デフォルトの接続設定
  if (ENV.DATABASE_URL) {
    if (isPoolerUrl(ENV.DATABASE_URL)) {
      logger.info('デフォルトの接続プーラーを使用します');
    } else {
      logger.info('デフォルトの直接接続を使用します');
    }
    return ENV.DATABASE_URL;
  }

  // 最後の手段
  throw new Error('有効なデータベース接続文字列が見つかりません');
};

/**
 * 現在の環境に基づいて適切なSupabase URLを取得
 * @returns 環境に対応するSupabase URL
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getSupabaseUrl = (): string => {
  switch (ENV.APP_ENV) {
    case 'production':
      return ENV.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION || ENV.NEXT_PUBLIC_SUPABASE_URL;
    case 'staging':
      return ENV.NEXT_PUBLIC_SUPABASE_URL_STAGING || ENV.NEXT_PUBLIC_SUPABASE_URL;
    case 'development':
      return ENV.NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT || ENV.NEXT_PUBLIC_SUPABASE_URL;
    case 'local':
    default:
      // ローカル環境では、明示的にNEXT_PUBLIC_SUPABASE_URLを使用（通常はlocalhost:54321を指す）
      return ENV.NEXT_PUBLIC_SUPABASE_URL;
  }
};

/**
 * 現在の環境に基づいて適切なSupabase匿名キーを取得
 * @returns 環境に対応するSupabase匿名キー
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getSupabaseAnonKey = (): string => {
  switch (ENV.APP_ENV) {
    case 'production':
      return ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY_PRODUCTION || ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case 'staging':
      return ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGING || ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case 'development':
      return ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT || ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    case 'local':
    default:
      // ローカル環境では、明示的にNEXT_PUBLIC_SUPABASE_ANON_KEYを使用
      return ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
};

/**
 * 現在の環境に基づいて適切なSupabaseサービスロールキーを取得
 * @returns 環境に対応するSupabaseサービスロールキー
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getSupabaseServiceRoleKey = (): string => {
  switch (ENV.APP_ENV) {
    case 'production':
      return ENV.SUPABASE_SERVICE_ROLE_KEY_PRODUCTION || ENV.SUPABASE_SERVICE_ROLE_KEY;
    case 'staging':
      return ENV.SUPABASE_SERVICE_ROLE_KEY_STAGING || ENV.SUPABASE_SERVICE_ROLE_KEY;
    case 'development':
      return ENV.SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT || ENV.SUPABASE_SERVICE_ROLE_KEY;
    case 'local':
    default:
      // ローカル環境では、明示的にSUPABASE_SERVICE_ROLE_KEYを使用
      return ENV.SUPABASE_SERVICE_ROLE_KEY;
  }
};

/**
 * 現在の環境がローカル環境かどうかを判定
 * @returns ローカル環境の場合はtrue
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const isLocal = (): boolean => {
  return ENV.APP_ENV === 'local';
};

/**
 * 現在の環境が開発環境かどうかを判定
 * @returns 開発環境の場合はtrue
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const isDevelopment = (): boolean => {
  return ENV.APP_ENV === 'development';
};

/**
 * 現在の環境がステージング環境かどうかを判定
 * @returns ステージング環境の場合はtrue
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const isStaging = (): boolean => {
  return ENV.APP_ENV === 'staging';
};

/**
 * 現在の環境が本番環境かどうかを判定
 * @returns 本番環境の場合はtrue
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const isProduction = (): boolean => {
  return ENV.APP_ENV === 'production';
};
