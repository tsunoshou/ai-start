import logger from '../../utils/logger';
import { testConnection } from '../client';
import { testSupabaseConnection } from '../client/supabase';

/**
 * データベース接続テスト実行スクリプト
 *
 * Drizzle直接接続とSupabase接続の両方をテストします
 */
async function runTests() {
  logger.info('=== データベース接続テスト開始 ===');
  logger.info(`環境変数DATABASE_URL: ${process.env.DATABASE_URL ? '設定済み' : '未設定'}`);
  logger.info(
    `環境変数NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定'}`
  );
  logger.info(
    `環境変数NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}`
  );

  // PostgreSQL直接接続テスト
  logger.info('\n--- PostgreSQL直接接続テスト ---');
  const directConnectionResult = await testConnection();

  // Supabase接続テスト
  logger.info('\n--- Supabase接続テスト ---');
  const supabaseConnectionResult = await testSupabaseConnection();

  // テスト結果の総合評価
  logger.info('\n=== テスト結果サマリー ===');

  if (directConnectionResult && supabaseConnectionResult) {
    logger.info('✅ すべての接続テストが成功しました');
    process.exit(0);
  } else {
    logger.error('❌ 一部またはすべての接続テストが失敗しました');

    if (!directConnectionResult) {
      logger.error('  - PostgreSQL直接接続: 失敗');
      logger.error('    DATABASE_URL環境変数を確認してください');
    }

    if (!supabaseConnectionResult) {
      logger.error('  - Supabase接続: 失敗');
      logger.error(
        '    NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY環境変数を確認してください'
      );
    }

    process.exit(1);
  }
}

// テスト実行
runTests().catch((error) => {
  logger.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});
