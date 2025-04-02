import { NextResponse } from 'next/server';

import { ENV } from '@/config/environment';

import { testConnection as testPostgresConnection } from '../../../infrastructure/database/client';
import { testConnection as testDirectPostgresConnection } from '../../../infrastructure/database/client/postgres';
import { testSupabaseConnection } from '../../../infrastructure/database/client/supabase';
import logger from '../../../infrastructure/utils/logger';

export interface ConnectionStatus {
  success: boolean;
  message: string;
}

export interface TestResults {
  database: {
    postgres: ConnectionStatus;
    supabase: ConnectionStatus;
  };
  openai: ConnectionStatus;
}

/**
 * システム接続テストAPI
 * データベース、OpenAI APIの接続状態を確認します
 */
export async function GET() {
  const results: TestResults = {
    database: {
      postgres: {
        success: false,
        message: 'テスト実行中...',
      },
      supabase: {
        success: false,
        message: 'テスト実行中...',
      },
    },
    openai: {
      success: false,
      message: 'テスト実行中...',
    },
  };

  try {
    // PostgreSQL直接接続テスト
    logger.info('PostgreSQL直接接続テスト実行');
    const directConnected = await testDirectPostgresConnection();
    results.database.postgres = {
      success: directConnected,
      message: directConnected
        ? 'PostgreSQL直接接続成功'
        : 'PostgreSQL直接接続失敗 - 環境変数を確認してください',
    };

    // DB接続テスト（client.tsの標準接続）
    logger.info('標準DB接続テスト実行');
    const dbConnected = await testPostgresConnection();
    if (!results.database.postgres.success && dbConnected) {
      results.database.postgres = {
        success: true,
        message: '標準DB接続成功',
      };
    }

    // Supabase接続テスト
    logger.info('Supabase接続テスト実行');
    const supabaseConnected = await testSupabaseConnection();
    results.database.supabase = {
      success: supabaseConnected,
      message: supabaseConnected
        ? 'Supabase接続成功'
        : 'Supabase接続失敗 - 環境変数を確認してください',
    };

    // OpenAI APIテスト
    // 注: 実際のAPIキーがある場合のみテスト可能
    try {
      const apiKey = ENV.OPENAI_API_KEY;
      const openaiSuccess = typeof apiKey === 'string' && apiKey.length > 10;
      results.openai = {
        success: openaiSuccess,
        message: openaiSuccess
          ? 'OpenAI API設定確認'
          : 'OpenAI API設定未確認 - APIキーを確認してください',
      };
    } catch (error) {
      results.openai = {
        success: false,
        message: `OpenAI API接続エラー: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    logger.error('接続テスト実行中にエラー発生:', error);
    return NextResponse.json(
      {
        error: 'システム接続テスト実行中にエラーが発生しました',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
