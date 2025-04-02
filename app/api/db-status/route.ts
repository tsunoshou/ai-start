import { NextResponse } from 'next/server';

import {
  checkPostgresEnvVars,
  checkSupabaseEnvVars,
  testDatabaseConnectionIfDev,
  testSupabaseConnectionIfDev,
  ConnectionTestResult,
} from '@/infrastructure/database/utils/test-db-connection';

/**
 * データベース接続状態レスポンスの型
 */
export interface DbStatusResponse {
  postgres: {
    envVars: ConnectionTestResult;
    connection: ConnectionTestResult;
  };
  supabase: {
    envVars: ConnectionTestResult;
    connection: ConnectionTestResult;
  };
  timestamp: string;
  nodeEnv: string;
}

/**
 * データベース状態確認API
 * 環境変数の存在確認と開発環境では接続テストも実行
 */
export async function GET() {
  try {
    // 環境情報取得
    const nodeEnv = process.env.NODE_ENV || 'development';
    const timestamp = new Date().toISOString();

    // 環境変数チェック (安全な操作)
    const postgresEnvCheck = checkPostgresEnvVars();
    const supabaseEnvCheck = checkSupabaseEnvVars();

    // 実際の接続テスト (開発環境のみ)
    const postgresConnectionTest = await testDatabaseConnectionIfDev();
    const supabaseConnectionTest = await testSupabaseConnectionIfDev();

    // レスポンス作成
    const response: DbStatusResponse = {
      postgres: {
        envVars: postgresEnvCheck,
        connection: postgresConnectionTest,
      },
      supabase: {
        envVars: supabaseEnvCheck,
        connection: supabaseConnectionTest,
      },
      timestamp,
      nodeEnv,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // エラーハンドリング
    return NextResponse.json(
      {
        error: 'データベース状態確認中にエラーが発生しました',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
