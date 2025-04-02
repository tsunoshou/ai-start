import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getDatabaseUrl } from '../../../config/environment';
import logger from '../../utils/logger';
import { CONNECTION_POOL, isPoolerUrl } from '../constants';

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = getDatabaseUrl();

// 環境変数が設定されていない場合はエラーをスロー
if (!DATABASE_URL) {
  throw new Error('データベースURL環境変数が設定されていません');
}

// 接続URLが接続プーラーを使用しているかチェック
const IS_POOLER = isPoolerUrl(DATABASE_URL);

// Postgresクライアントの設定
// SQLクエリ実行用
export const SQL = postgres(DATABASE_URL, {
  max: IS_POOLER ? CONNECTION_POOL.POOLER_MAX_CONNECTIONS : CONNECTION_POOL.DIRECT_MAX_CONNECTIONS,
  idle_timeout: IS_POOLER
    ? CONNECTION_POOL.IDLE_TIMEOUT.POOLER
    : CONNECTION_POOL.IDLE_TIMEOUT.DIRECT,
  connect_timeout: CONNECTION_POOL.CONNECT_TIMEOUT,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('[::1]') ? false : true, // ローカル環境ではSSLを無効化
});

// テスト用の接続関数
export async function testConnection(): Promise<boolean> {
  try {
    // 単純なクエリでデータベース接続をテスト
    const result = await SQL`SELECT 1 as test`;
    logger.info(`PostgreSQL接続成功 - 接続タイプ: ${IS_POOLER ? '接続プーラー' : '直接接続'}`);
    return result.length > 0 && result[0].test === 1;
  } catch (error) {
    logger.error('PostgreSQL接続エラー:', error);
    return false;
  }
}

// DrizzleORMのクライアント
// スキーマベースのタイプセーフなデータベース操作用
export const DB = drizzle(SQL);
