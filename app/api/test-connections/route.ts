import { NextResponse } from 'next/server';

import {
  testDatabaseConnectionIfDev,
  testSupabaseConnectionIfDev,
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
}

/**
 * シンプルなシステム接続テストAPI
 */
export async function GET() {
  // ビルド時のみテストをスキップ（Vercel/CI環境）
  const isBuildTime = process.env.VERCEL === '1' || process.env.CI === 'true';

  // ビルド時は簡易レスポンス
  if (isBuildTime) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      postgres: { success: true, message: 'ビルド時はテストをスキップします' },
      supabase: { success: true, message: 'ビルド時はテストをスキップします' },
    });
  }

  try {
    // PostgreSQLとSupabase接続テスト
    const [postgres, supabase] = await Promise.all([
      testDatabaseConnectionIfDev(),
      testSupabaseConnectionIfDev(),
    ]);

    const results: TestResults = {
      timestamp: new Date().toISOString(),
      postgres,
      supabase,
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
