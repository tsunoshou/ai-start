import { NextResponse } from 'next/server';

import {
  testDatabaseConnection,
  testSupabaseConnection,
  testOpenAIConnection,
} from '@/infrastructure/database/utils/test-db-connection';

import logger from '../../../infrastructure/utils/logger';

// API接続テスト結果
export async function GET() {
  try {
    // 接続テスト実行
    const [postgres, supabase, openai] = await Promise.all([
      testDatabaseConnection(),
      testSupabaseConnection(),
      testOpenAIConnection(),
    ]);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      postgres,
      supabase,
      openai,
    });
  } catch (error) {
    logger.error('接続テスト実行中にエラー:', error);
    return NextResponse.json(
      { error: '接続テストエラー', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
