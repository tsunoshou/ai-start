import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { getDatabaseUrl } from '../../config/environment';
import logger from '../utils/logger';

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

/**
 * マイグレーション用の一時的なSQL接続を作成
 */
const MIGRATION_CLIENT = postgres(CONNECTION_STRING, { max: 1 });

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
 * 接続プールを適切に設定
 */
// postgres.jsパッケージはスネークケースのオプション名を要求するため、ESLintルールを一時的に無効化
// eslint-disable-next-line @typescript-eslint/naming-convention
const QUERY_CLIENT = postgres(CONNECTION_STRING, {
  max: 10, // 接続プールの最大数
  // eslint-disable-next-line @typescript-eslint/naming-convention
  idle_timeout: 30, // アイドル接続のタイムアウト（秒）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  connect_timeout: 10, // 接続タイムアウト（秒）
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
  const migrationClient = postgres(connectionString, { max: 1 });
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
