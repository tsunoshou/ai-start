import { container } from 'tsyringe';

import { ENV } from '@/config/environment';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';

import { runMigrationToSpecificDB } from '../client';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

/**
 * すべての環境に対してマイグレーションを実行する
 */
async function migrateAllEnvironments() {
  try {
    logger.info({ message: 'すべての環境に対するデータベースマイグレーションを開始します' });

    // 開発環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_DEVELOPMENT) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_DEVELOPMENT);
      logger.info({
        message: '開発環境（ai-start-dev）のデータベースマイグレーションが完了しました',
      });
    } else {
      logger.warn({ message: '開発環境のデータベースURLが設定されていません。スキップします。' });
    }

    // ステージング環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_STAGING) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_STAGING);
      logger.info({
        message: 'ステージング環境（ai-start-staging）のデータベースマイグレーションが完了しました',
      });
    } else {
      logger.warn({
        message: 'ステージング環境のデータベースURLが設定されていません。スキップします。',
      });
    }

    // 本番環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_PRODUCTION) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_PRODUCTION);
      logger.info({ message: '本番環境（ai-start）のデータベースマイグレーションが完了しました' });
    } else {
      logger.warn({ message: '本番環境のデータベースURLが設定されていません。スキップします。' });
    }

    logger.info({ message: 'すべての環境へのデータベースマイグレーションが完了しました' });
    process.exit(0);
  } catch (error) {
    logger.error({
      message: 'データベースマイグレーション中にエラーが発生しました',
      error,
    });
    process.exit(1);
  }
}

// スクリプトを実行
migrateAllEnvironments();
