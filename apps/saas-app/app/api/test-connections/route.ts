import 'reflect-metadata';
import '@/config/container.config.ts'; // DIコンテナ設定を明示的にインポート
import { NextResponse } from 'next/server';
import { container } from 'tsyringe';

import {
  testDatabaseConnection,
  testSupabaseConnection,
  testOpenAIConnection,
} from '@core/shared/infrastructure/database/utils/test-db-connection.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { LoggerToken } from '@core/shared/logger/logger.token.ts';

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
      error,
    });

    return NextResponse.json(
      { error: '接続テストエラー', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
