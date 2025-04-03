/* eslint-disable react/jsx-sort-props */
'use client';

import { useState } from 'react';

type ConnectionStatus = {
  success: boolean;
  message: string;
};

type TestResults = {
  timestamp: string;
  postgres: ConnectionStatus;
  supabase: ConnectionStatus;
  openai: ConnectionStatus;
};

export default function ConnectionTest() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-connections');
      if (!response.ok) throw new Error('接続エラー');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setError('テスト実行中にエラーが発生しました');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      <button
        className="text-xs text-gray-500 hover:text-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '接続テストを閉じる ▲' : '接続テストを開く ▼'}
      </button>

      {expanded && (
        <div className="mt-2 rounded bg-gray-50 p-3 text-sm shadow-sm">
          <div className="mb-3 flex justify-between">
            <h3>接続テスト</h3>
            <button
              className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
              disabled={loading}
              onClick={runTests}
            >
              {loading ? '実行中...' : 'テスト実行'}
            </button>
          </div>

          {error && <div className="mb-2 text-xs text-red-600">{error}</div>}

          {results && (
            <div className="space-y-2">
              <div className="flex items-start">
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${results.postgres.success ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <div>
                  <div className="text-xs font-medium">PostgreSQL</div>
                  <div className="text-xs text-gray-600">{results.postgres.message}</div>
                </div>
              </div>

              <div className="flex items-start">
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${results.supabase.success ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <div>
                  <div className="text-xs font-medium">Supabase</div>
                  <div className="text-xs text-gray-600">{results.supabase.message}</div>
                </div>
              </div>

              <div className="flex items-start">
                <div
                  className={`mr-2 h-3 w-3 rounded-full ${results.openai.success ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <div>
                  <div className="text-xs font-medium">OpenAI</div>
                  <div className="text-xs text-gray-600">{results.openai.message}</div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {!results && !loading && !error && (
            <p className="text-xs text-gray-500">「テスト実行」を押して接続状態を確認</p>
          )}
        </div>
      )}
    </div>
  );
}
