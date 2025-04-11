import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { container } from 'tsyringe';

import { ENV } from '@/config/environment.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { LoggerToken } from '@core/shared/logger/logger.token.ts';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

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
    if (!ENV.DATABASE_URL) {
      return createResult(false, 'データベース接続情報が不足しています');
    }

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
    logger.error({
      message: 'データベース接続エラー',
      error,
    });
    return createResult(false, 'データベース接続エラー');
  }
}

/**
 * Supabase接続テスト
 * @returns 接続テスト結果
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  try {
    if (!ENV.NEXT_PUBLIC_SUPABASE_URL || !ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createResult(false, 'Supabase接続情報が不足しています');
    }

    const supabase = createClient(ENV.NEXT_PUBLIC_SUPABASE_URL, ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      logger.error({
        message: 'Supabase接続エラー',
        error,
      });
      return createResult(false, 'Supabase接続テスト失敗');
    }

    return createResult(true, 'Supabase接続成功');
  } catch (error) {
    logger.error({
      message: 'Supabase接続エラー',
      error,
    });
    return createResult(false, 'Supabase接続エラー');
  }
}

/**
 * OpenAI接続テスト
 * @returns 接続テスト結果
 */
export async function testOpenAIConnection(): Promise<ConnectionTestResult> {
  try {
    if (!ENV.OPENAI_API_KEY) {
      return createResult(false, 'OpenAI APIキーが不足しています');
    }

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
      logger.error({
        message: 'OpenAI接続エラー',
        error,
      });
      return createResult(false, 'OpenAI接続テスト失敗');
    }

    return createResult(true, 'OpenAI接続成功');
  } catch (error) {
    logger.error({
      message: 'OpenAI接続エラー',
      error,
    });
    return createResult(false, 'OpenAI接続エラー');
  }
}
