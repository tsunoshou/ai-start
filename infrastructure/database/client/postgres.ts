import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { container } from 'tsyringe';

import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

import { getDatabaseUrl } from '../../../config/environment';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = getDatabaseUrl();

// 環境変数が設定されていない場合はエラーをスロー
if (!DATABASE_URL) {
  throw new Error('データベースURL環境変数が設定されていません');
}

// 接続URLからプーラーの使用を検出
const IS_POOLER =
  DATABASE_URL.includes('pooler.supabase.com') || DATABASE_URL.includes('pgbouncer=true');

// Postgresクライアントの設定
// SQLクエリ実行用
export const SQL = postgres(DATABASE_URL, {
  max: IS_POOLER ? 10 : 5, // 接続プールの最大接続数（プーラー使用時は多めに）
  // プーラー使用時は prepare 無効化が必要
  /* eslint-disable @typescript-eslint/naming-convention */
  prepare: IS_POOLER ? false : true,
  idle_timeout: 20,
  connect_timeout: 30000,
  /* eslint-enable @typescript-eslint/naming-convention */
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('[::1]') ? false : true, // ローカル環境ではSSLを無効化
});

// Drizzle ORMインスタンス作成
export const DB = drizzle(SQL);

// テスト用の接続関数
export async function testConnection(): Promise<boolean> {
  try {
    // 単純なクエリでデータベース接続をテスト
    const result = await SQL`SELECT 1 as test`;
    logger.info({ message: 'PostgreSQL接続テスト成功' });
    return result.length > 0 && result[0].test === 1;
  } catch (error) {
    logger.error({
      message: 'PostgreSQL接続エラー',
      error
    });
    return false;
  }
}
