import { NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/naming-convention
import OpenAI from 'openai';
import { Pool } from 'pg';

import { ENV, getDatabaseUrl } from '@/config/environment';

// OpenAIクライアントの初期化（APIキーがある場合のみ）
const OPENAI = ENV.OPENAI_API_KEY ? new OpenAI({ apiKey: ENV.OPENAI_API_KEY }) : null;

export async function GET() {
  const results = {
    database: {
      success: false,
      message: '',
      timestamp: new Date().toISOString(),
    },
    openai: {
      success: false,
      message: '',
      timestamp: new Date().toISOString(),
    },
  };

  // データベース接続テスト
  try {
    // 環境に応じたデータベースURLを取得
    const connectionString = getDatabaseUrl();
    const pool = new Pool({ connectionString });

    // 単一のクエリを実行して接続をテスト
    const dbResult = await pool.query('SELECT NOW() as now');
    await pool.end(); // 接続を閉じる

    results.database.success = true;
    results.database.message = `接続成功: ${dbResult.rows[0].now}`;
  } catch (error) {
    results.database.success = false;
    results.database.message = `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
  }

  // OpenAI接続テスト
  try {
    if (!ENV.OPENAI_API_KEY) {
      results.openai.success = false;
      results.openai.message =
        '未設定: 環境変数 OPENAI_API_KEY が設定されていません。必要に応じて .env.local に追加してください。';
    } else if (!OPENAI) {
      results.openai.success = false;
      results.openai.message = 'クライアント初期化エラー: OpenAIクライアントの初期化に失敗しました';
    } else {
      const aiResponse = await OPENAI.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Connection successful!" in Japanese' },
        ],
        // ESLintの命名規則エラーを無視（OpenAI APIの仕様に従う必要がある）
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_tokens: 10,
      });

      results.openai.success = true;
      results.openai.message = `接続成功: ${aiResponse.choices[0]?.message?.content || '応答なし'}`;
    }
  } catch (error) {
    results.openai.success = false;
    results.openai.message = `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
  }

  return NextResponse.json(results);
}
