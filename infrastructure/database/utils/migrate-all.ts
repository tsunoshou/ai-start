import { ENV } from '../../../config/environment';
import logger from '../../utils/logger';
import { runMigrationToSpecificDB } from '../client';

/**
 * すべての環境に対してマイグレーションを実行する
 */
async function migrateAllEnvironments() {
  try {
    logger.info('すべての環境に対するデータベースマイグレーションを開始します');

    // 開発環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_DEVELOPMENT) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_DEVELOPMENT);
      logger.info('開発環境（ai-start-dev）のデータベースマイグレーションが完了しました');
    } else {
      logger.warn('開発環境のデータベースURLが設定されていません。スキップします。');
    }

    // ステージング環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_STAGING) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_STAGING);
      logger.info(
        'ステージング環境（ai-start-staging）のデータベースマイグレーションが完了しました'
      );
    } else {
      logger.warn('ステージング環境のデータベースURLが設定されていません。スキップします。');
    }

    // 本番環境のデータベースマイグレーション
    if (ENV.DATABASE_URL_PRODUCTION) {
      await runMigrationToSpecificDB(ENV.DATABASE_URL_PRODUCTION);
      logger.info('本番環境（ai-start）のデータベースマイグレーションが完了しました');
    } else {
      logger.warn('本番環境のデータベースURLが設定されていません。スキップします。');
    }

    logger.info('すべての環境へのデータベースマイグレーションが完了しました');
    process.exit(0);
  } catch (error) {
    logger.error('データベースマイグレーション中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
migrateAllEnvironments();
