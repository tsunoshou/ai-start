import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

import { ENV } from '@/config/environment';

import logger from '../../utils/logger';

/**
 * 接続テスト結果の型
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

/**
 * 本番環境かどうかを判断する
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * シンプルなPostgres接続テスト
 * 環境変数チェックのみで実際の接続は試行しない安全なバージョン
 */
export function checkPostgresEnvVars(): ConnectionTestResult {
  try {
    logger.info(`環境変数DATABASE_URL: ${ENV.DATABASE_URL ? '設定済み' : '未設定'}`);

    // 本番環境では実際の接続テストを行わず、環境変数の存在確認のみ
    const hasDbUrl = typeof ENV.DATABASE_URL === 'string' && ENV.DATABASE_URL.length > 10;

    if (!hasDbUrl) {
      return {
        success: false,
        message: 'データベース接続情報が不足しています',
        timestamp: new Date().toISOString(),
        details: {
          hasDatabaseUrl: Boolean(ENV.DATABASE_URL),
        },
      };
    }

    return {
      success: true,
      message: 'データベース接続情報が正しく設定されています',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('環境変数チェック中にエラーが発生しました:', error);
    return {
      success: false,
      message: `環境変数チェックエラー: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * シンプルなSupabase環境変数チェック
 * 実際の接続テストは行わない安全なバージョン
 */
export function checkSupabaseEnvVars(): ConnectionTestResult {
  try {
    const hasUrl =
      typeof ENV.NEXT_PUBLIC_SUPABASE_URL === 'string' && ENV.NEXT_PUBLIC_SUPABASE_URL.length > 10;
    const hasKey =
      typeof ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' &&
      ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 10;

    if (!hasUrl || !hasKey) {
      return {
        success: false,
        message: 'Supabase接続情報が不足しています',
        timestamp: new Date().toISOString(),
        details: {
          hasUrl,
          hasKey,
        },
      };
    }

    return {
      success: true,
      message: 'Supabase接続情報が正しく設定されています',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Supabase環境変数チェック中にエラーが発生しました:', error);
    return {
      success: false,
      message: `Supabase環境変数チェックエラー: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 開発環境でのみ実行される実際のDB接続テスト
 * 本番環境では安全のため実行されない
 */
export async function testDatabaseConnectionIfDev(): Promise<ConnectionTestResult> {
  // 本番環境ではテストをスキップ
  if (IS_PRODUCTION) {
    return {
      success: true,
      message: '本番環境では接続テストはスキップされます',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // 環境変数チェック
    const envCheck = checkPostgresEnvVars();
    if (!envCheck.success) {
      return envCheck;
    }

    // 開発環境のみ実際に接続テスト
    const sql = postgres(ENV.DATABASE_URL, {
      max: 1, // 単一接続のみ
      idle_timeout: 5, // 5秒のアイドルタイムアウト
      connect_timeout: 10, // 10秒の接続タイムアウト
      ssl: ENV.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    try {
      // シンプルなテストクエリを実行
      const result = await sql`SELECT 1 as connected`;
      const isConnected = result.length > 0 && result[0].connected === 1;

      return {
        success: isConnected,
        message: isConnected ? 'データベース接続テスト成功' : 'データベース接続テスト失敗',
        timestamp: new Date().toISOString(),
      };
    } finally {
      // 必ず接続を閉じる
      await sql.end();
    }
  } catch (error) {
    logger.error('データベース接続テスト中にエラーが発生しました:', error);
    return {
      success: false,
      message: `データベース接続エラー: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 開発環境でのみ実行されるSupabase接続テスト
 * 本番環境では安全のため実行されない
 */
export async function testSupabaseConnectionIfDev(): Promise<ConnectionTestResult> {
  // 本番環境ではテストをスキップ
  if (IS_PRODUCTION) {
    return {
      success: true,
      message: '本番環境ではSupabase接続テストはスキップされます',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    // 環境変数チェック
    const envCheck = checkSupabaseEnvVars();
    if (!envCheck.success) {
      return envCheck;
    }

    // 開発環境のみ実際に接続テスト
    if (ENV.NEXT_PUBLIC_SUPABASE_URL && ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        ENV.NEXT_PUBLIC_SUPABASE_URL,
        ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      // ヘルスチェックのみ実行(認証不要なエンドポイント)
      try {
        const { error } = await supabase.from('_health').select('*').limit(1);

        if (error) {
          logger.error('Supabase接続テストエラー:', error);
          return {
            success: false,
            message: `Supabase接続エラー: ${error.message || String(error)}`,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          message: 'Supabase接続テスト成功',
          timestamp: new Date().toISOString(),
        };
      } catch (err: unknown) {
        const error = err as Error;
        logger.error('Supabase接続テストでエラーが発生:', error.message);
        return {
          success: false,
          message: `Supabase接続エラー: ${error.message || String(error)}`,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      success: false,
      message: 'Supabase接続情報が設定されていません',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Supabase接続テスト中にエラーが発生しました:', error);
    return {
      success: false,
      message: `Supabase接続エラー: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}
