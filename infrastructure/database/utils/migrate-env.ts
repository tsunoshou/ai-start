import { getDatabaseUrl } from '../../../config/environment';
import logger from '../../utils/logger';
import { runMigrationToSpecificDB } from '../client';

/**
 * 環境変数で指定された環境に対してマイグレーションを実行する
 */
async function migrateSpecificEnvironment() {
  // 現在の環境に対応するデータベースURLを取得
  const databaseUrl = getDatabaseUrl();

  try {
    logger.info(
      `環境 [${process.env.APP_ENV || 'default'}] のデータベースマイグレーションを開始します`
    );

    // 特定のデータベースに対してマイグレーションを実行
    await runMigrationToSpecificDB(databaseUrl);

    logger.info(
      `環境 [${process.env.APP_ENV || 'default'}] のデータベースマイグレーションが完了しました`
    );
    process.exit(0);
  } catch (error) {
    logger.error(
      `環境 [${process.env.APP_ENV || 'default'}] のデータベースマイグレーション中にエラーが発生しました:`,
      error
    );
    process.exit(1);
  }
}

// スクリプトを実行
migrateSpecificEnvironment();
