import { NextResponse } from 'next/server';

import {
  testDatabaseConnection,
  testSupabaseConnection,
  testOpenAIConnection,
} from '@/infrastructure/database/utils/test-db-connection';

import logger from '../../../infrastructure/utils/logger';

export interface ConnectionStatus {
  success: boolean;
  message: string;
}

export interface TestResults {
  timestamp: string;
  postgres: ConnectionStatus;
  supabase: ConnectionStatus;
  openai: ConnectionStatus;
}

/**
 * シンプルなシステム接続テストAPI
 * ボタンを押した時のみ実行される
 */
export async function GET() {
  try {
    // 各サービスの接続テスト実行
    const [postgres, supabase, openai] = await Promise.all([
      testDatabaseConnection(),
      testSupabaseConnection(),
      testOpenAIConnection(),
    ]);

    const results: TestResults = {
      timestamp: new Date().toISOString(),
      postgres,
      supabase,
      openai,
    };

    return NextResponse.json(results);
  } catch (error) {
    logger.error('接続テスト実行中にエラー:', error);
    return NextResponse.json(
      { error: '接続テストエラー', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
