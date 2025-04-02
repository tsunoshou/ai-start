import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { getDatabaseUrl } from '../../config/environment';
import logger from '../utils/logger';

import { CONNECTION_POOL, isLocalConnection, isPoolerUrl } from './constants';
import * as schema from './schema';

/**
 * 環境変数からデータベース接続文字列を取得
 * 環境に応じて異なる接続文字列を使用
 */
const CONNECTION_STRING = getDatabaseUrl();

if (!CONNECTION_STRING) {
  throw new Error(
    'データベース接続文字列を取得できませんでした。環境変数の設定を確認してください。'
  );
}

// 接続URLからプーラーの使用を検出
const IS_POOLER = isPoolerUrl(CONNECTION_STRING);

logger.info(`データベース接続タイプ: ${IS_POOLER ? '接続プーラー' : '直接接続'}`);

/**
 * マイグレーション用の一時的なSQL接続を作成
 * マイグレーションは一時的な接続なので、最小限の設定で十分
 */
const MIGRATION_CLIENT = postgres(CONNECTION_STRING, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: isLocalConnection(CONNECTION_STRING)
    ? CONNECTION_POOL.SSL_CONFIG.LOCAL
    : CONNECTION_POOL.SSL_CONFIG.REMOTE,
});

/**
 * マイグレーションを実行する関数
 */
export async function runMigrations() {
  try {
    logger.info('データベースマイグレーションを開始します...');
    await migrate(drizzle(MIGRATION_CLIENT), {
      migrationsFolder: './infrastructure/database/migrations',
    });
    logger.info('マイグレーション完了');
  } catch (error) {
    logger.error('マイグレーション中にエラーが発生しました:', error);
    throw error;
  } finally {
    await MIGRATION_CLIENT.end();
  }
}

/**
 * クエリ実行用のSQL接続を作成
 * 接続プーラーを使用する場合とそうでない場合で設定を最適化
 */
const QUERY_CLIENT = postgres(CONNECTION_STRING, {
  // 接続プーラー使用時はプールサイズを最適化
  max: IS_POOLER ? CONNECTION_POOL.POOLER_MAX_CONNECTIONS : CONNECTION_POOL.DIRECT_MAX_CONNECTIONS,
  idle_timeout: IS_POOLER
    ? CONNECTION_POOL.IDLE_TIMEOUT.POOLER
    : CONNECTION_POOL.IDLE_TIMEOUT.DIRECT,
  connect_timeout: CONNECTION_POOL.CONNECT_TIMEOUT,
  max_lifetime: IS_POOLER
    ? CONNECTION_POOL.MAX_LIFETIME.POOLER
    : CONNECTION_POOL.MAX_LIFETIME.DIRECT,
  // プリペアドステートメントの設定
  prepare: IS_POOLER ? CONNECTION_POOL.PREPARE.POOLER : CONNECTION_POOL.PREPARE.DIRECT,
  // SSL設定
  ssl: isLocalConnection(CONNECTION_STRING)
    ? CONNECTION_POOL.SSL_CONFIG.LOCAL
    : CONNECTION_POOL.SSL_CONFIG.REMOTE,
  // デバッグ設定
  debug: process.env.NODE_ENV === 'development', // 開発環境ではデバッグを有効化
});

/**
 * Drizzle ORMクライアントをエクスポート
 */
export const DB = drizzle(QUERY_CLIENT, { schema });

/**
 * テスト接続を実行する関数
 */
export async function testConnection() {
  try {
    // 単純なSELECT文を実行してデータベース接続をテスト
    const result = await QUERY_CLIENT`SELECT NOW() as current_time`;
    logger.info('データベース接続成功:', result[0].current_time);
    logger.info(`接続タイプ: ${IS_POOLER ? '接続プーラー' : '直接接続'}`);
    return true;
  } catch (error) {
    logger.error('データベース接続エラー:', error);
    return false;
  }
}

/**
 * マイグレーションを特定のデータベースに対して実行する関数
 * @param connectionString 対象データベースの接続文字列
 */
export async function runMigrationToSpecificDB(connectionString: string) {
  const isTargetPooler = isPoolerUrl(connectionString);

  const migrationClient = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: isTargetPooler ? CONNECTION_POOL.PREPARE.POOLER : CONNECTION_POOL.PREPARE.DIRECT,
    ssl: isLocalConnection(connectionString)
      ? CONNECTION_POOL.SSL_CONFIG.LOCAL
      : CONNECTION_POOL.SSL_CONFIG.REMOTE,
  });

  try {
    logger.info(
      `データベース ${connectionString.split('@')[1]?.split('/')[0] || '不明'} へのマイグレーションを開始します...`
    );
    await migrate(drizzle(migrationClient), {
      migrationsFolder: './infrastructure/database/migrations',
    });
    logger.info(
      `データベース ${connectionString.split('@')[1]?.split('/')[0] || '不明'} へのマイグレーション完了`
    );
  } catch (error) {
    logger.error('マイグレーション中にエラーが発生しました:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}
