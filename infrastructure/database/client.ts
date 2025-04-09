import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { container } from 'tsyringe';

import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

import { getDatabaseUrl } from '../../config/environment';

import * as schema from './schema';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

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
const IS_POOLER =
  CONNECTION_STRING.includes('pooler.supabase.com') || CONNECTION_STRING.includes('pgbouncer=true');

logger.info({
  message: `データベース接続タイプ: ${IS_POOLER ? '接続プーラー' : '直接接続'}`,
});

/**
 * マイグレーション用の一時的なSQL接続を作成
 * マイグレーションは一時的な接続なので、最小限の設定で十分
 */
const MIGRATION_CLIENT = postgres(CONNECTION_STRING, {
  max: 1,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  idle_timeout: 20,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  connect_timeout: 10,
});

/**
 * マイグレーションを実行する関数
 */
export async function runMigrations() {
  try {
    logger.info({ message: 'データベースマイグレーションを開始します...' });
    await migrate(drizzle(MIGRATION_CLIENT), {
      migrationsFolder: './infrastructure/database/migrations',
    });
    logger.info({ message: 'マイグレーション完了' });
  } catch (error) {
    logger.error({
      message: 'マイグレーション中にエラーが発生しました',
      error,
    });
    throw error;
  } finally {
    await MIGRATION_CLIENT.end();
  }
}

/**
 * クエリ実行用のSQL接続を作成
 * 接続プーラーを使用する場合とそうでない場合で設定を最適化
 */
// postgres.jsパッケージはスネークケースのオプション名を要求するため、ESLintルールを一時的に無効化
const QUERY_CLIENT = postgres(CONNECTION_STRING, {
  // 接続プーラー使用時はプールサイズを最適化
  max: IS_POOLER ? 20 : 10,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  idle_timeout: IS_POOLER ? 20 : 30, // 接続プーラー使用時はアイドルタイムアウトを短縮（秒）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  connect_timeout: 15, // 接続タイムアウト（秒）
  // eslint-disable-next-line @typescript-eslint/naming-convention
  max_lifetime: IS_POOLER ? 60 * 10 : 60 * 30, // 接続の最大寿命（秒）
  // プリペアドステートメントの設定
  // eslint-disable-next-line @typescript-eslint/naming-convention
  prepare: IS_POOLER ? false : true, // 接続プーラー使用時はプリペアドステートメントを無効化
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
    logger.info({
      message: 'データベース接続成功',
      currentTime: result[0].current_time,
      connectionType: IS_POOLER ? '接続プーラー' : '直接接続',
    });
    return true;
  } catch (error) {
    logger.error({
      message: 'データベース接続エラー',
      error,
    });
    return false;
  }
}

/**
 * マイグレーションを特定のデータベースに対して実行する関数
 * @param connectionString 対象データベースの接続文字列
 */
export async function runMigrationToSpecificDB(connectionString: string) {
  const isTargetPooler =
    connectionString.includes('pooler.supabase.com') || connectionString.includes('pgbouncer=true');

  const migrationClient = postgres(connectionString, {
    max: 1,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    idle_timeout: 20,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    connect_timeout: 10,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    prepare: isTargetPooler ? false : true,
  });

  try {
    const dbInfo = connectionString.split('@')[1]?.split('/')[0] || '不明';
    logger.info({
      message: `データベース ${dbInfo} へのマイグレーションを開始します...`,
    });

    await migrate(drizzle(migrationClient), {
      migrationsFolder: './infrastructure/database/migrations',
    });

    logger.info({
      message: `データベース ${dbInfo} へのマイグレーション完了`,
    });
  } catch (error) {
    logger.error({
      message: 'マイグレーション中にエラーが発生しました',
      error,
    });
    throw error;
  } finally {
    await migrationClient.end();
  }
}
