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
}

/**
 * 接続テスト結果を作成するヘルパー関数
 */
function createResult(success: boolean, message: string): ConnectionTestResult {
  return {
    success,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * PostgreSQL接続テスト
 * @returns 接続テスト結果
 */
export async function testDatabaseConnection(): Promise<ConnectionTestResult> {
  try {
    // 環境変数チェック
    if (!ENV.DATABASE_URL || ENV.DATABASE_URL.length < 10) {
      return createResult(false, 'データベース接続情報が不足しています');
    }

    // 接続テスト実行
    const sql = postgres(ENV.DATABASE_URL, {
      max: 1,
      /* eslint-disable @typescript-eslint/naming-convention */
      idle_timeout: 5,
      connect_timeout: 10,
      /* eslint-enable @typescript-eslint/naming-convention */
      ssl: ENV.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });

    try {
      const result = await sql`SELECT 1 as connected`;
      const connected = result.length > 0 && result[0].connected === 1;
      return createResult(connected, connected ? 'データベース接続成功' : 'データベース接続失敗');
    } finally {
      await sql.end();
    }
  } catch (error) {
    logger.error('データベース接続テストエラー:', error);
    return createResult(false, 'データベース接続エラー');
  }
}

/**
 * Supabase接続テスト
 * @returns 接続テスト結果
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  try {
    // 環境変数チェック
    if (!ENV.NEXT_PUBLIC_SUPABASE_URL || !ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createResult(false, 'Supabase接続情報が不足しています');
    }

    // 接続テスト実行
    const supabase = createClient(ENV.NEXT_PUBLIC_SUPABASE_URL, ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 最もシンプルな接続テスト - 認証情報取得
    // 接続自体のテストだけを行う（実際のデータベース操作は行わない）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Supabase接続エラー:', error);
      return createResult(false, 'Supabase接続テスト失敗');
    }

    // セッションがなくても接続できていればOK
    return createResult(true, 'Supabase接続成功');
  } catch (error) {
    logger.error('Supabase接続テストエラー:', error);
    return createResult(false, 'Supabase接続エラー');
  }
}

/**
 * OpenAI接続テスト
 * @returns 接続テスト結果
 */
export async function testOpenAIConnection(): Promise<ConnectionTestResult> {
  try {
    // 環境変数チェック
    if (!ENV.OPENAI_API_KEY) {
      return createResult(false, 'OpenAI APIキーが不足しています');
    }

    // 最もシンプルな接続テスト - GETリクエストで接続確認
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        /* eslint-disable @typescript-eslint/naming-convention */
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('OpenAI接続エラー:', error);
      return createResult(false, 'OpenAI接続テスト失敗');
    }

    return createResult(true, 'OpenAI接続成功');
  } catch (error) {
    logger.error('OpenAI接続テストエラー:', error);
    return createResult(false, 'OpenAI接続エラー');
  }
}
