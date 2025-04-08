import { NextResponse } from 'next/server';
import { container } from 'tsyringe';

import {
  testDatabaseConnection,
  testSupabaseConnection,
  testOpenAIConnection,
} from '@/infrastructure/database/utils/test-db-connection';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

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
    logger.error({
      message: '接続テスト実行中にエラー',
      error
    });
    
    return NextResponse.json(
      { error: '接続テストエラー', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
