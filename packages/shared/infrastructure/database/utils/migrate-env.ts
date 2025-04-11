import { container } from 'tsyringe';

import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';

import { getDatabaseUrl } from '../../../config/environment';
import { runMigrationToSpecificDB } from '../client';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

/**
 * 環境変数で指定された環境に対してマイグレーションを実行する
 */
async function migrateSpecificEnvironment() {
  // 現在の環境に対応するデータベースURLを取得
  const databaseUrl = getDatabaseUrl();
  const envName = process.env.APP_ENV || 'default';

  try {
    logger.info({
      message: `環境 [${envName}] のデータベースマイグレーションを開始します`,
    });

    // 特定のデータベースに対してマイグレーションを実行
    await runMigrationToSpecificDB(databaseUrl);

    logger.info({
      message: `環境 [${envName}] のデータベースマイグレーションが完了しました`,
    });
    process.exit(0);
  } catch (error) {
    logger.error({
      message: `環境 [${envName}] のデータベースマイグレーション中にエラーが発生しました`,
      error,
    });
    process.exit(1);
  }
}

// スクリプトを実行
migrateSpecificEnvironment();
