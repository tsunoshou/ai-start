import { NextResponse } from 'next/server';

import { ENV } from '@/config/environment';

import { testConnection } from '../../../infrastructure/database/client';
import { testSupabaseConnection } from '../../../infrastructure/database/client/supabase';
import logger from '../../../infrastructure/utils/logger';

export interface ConnectionStatus {
  success: boolean;
  message: string;
}

export interface TestResults {
  database: ConnectionStatus;
  openai: ConnectionStatus;
}

/**
 * システム接続テストAPI
 * データベース、OpenAI APIの接続状態を確認します
 */
export async function GET() {
  const results: TestResults = {
    database: {
      success: false,
      message: 'テスト実行中...',
    },
    openai: {
      success: false,
      message: 'テスト実行中...',
    },
  };

  try {
    // PostgreSQL接続テスト
    logger.info('データベース接続テスト実行');
    const dbConnected = await testConnection();
    results.database = {
      success: dbConnected,
      message: dbConnected
        ? 'データベース接続成功'
        : 'データベース接続失敗 - 環境変数を確認してください',
    };

    // Supabase接続テスト（実質的にはデータベーステストと重複するが、API経由での接続を確認）
    const supabaseConnected = await testSupabaseConnection();
    if (!results.database.success && supabaseConnected) {
      results.database = {
        success: true,
        message: 'Supabase経由でのデータベース接続成功',
      };
    }

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
