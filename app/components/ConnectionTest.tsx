/* eslint-disable react/jsx-sort-props */
'use client';

import { useState } from 'react';

type ConnectionStatus = {
  success: boolean;
  message: string;
  timestamp: string;
};

type TestResults = {
  database: ConnectionStatus;
  openai: ConnectionStatus;
};

export default function ConnectionTest() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-connections');
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('接続テストエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full max-w-4xl">
      <div className="flex items-center justify-between border-t pt-4 text-sm text-gray-500">
        <button
          className="flex items-center text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '接続テストを隠す' : '接続テストを表示'}
          <svg
            className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm shadow-sm">
          <div className="mb-4 flex justify-between">
            <h3 className="font-medium">システム接続テスト</h3>
            <button
              className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-800 transition-colors hover:bg-blue-200"
              disabled={loading}
              onClick={runTests}
            >
              {loading ? '実行中...' : 'テスト実行'}
            </button>
          </div>

          {results && (
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                {/* eslint-disable react/jsx-sort-props */}
                <div
                  className={`${
                    results.database.success ? 'bg-green-500' : 'bg-red-500'
                  } mt-0.5 h-4 w-4 flex-shrink-0 rounded-full`}
                ></div>
                {/* eslint-enable react/jsx-sort-props */}
                <div>
                  <div className="font-medium">PostgreSQL データベース</div>
                  <div className="text-xs text-gray-600">{results.database.message}</div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                {/* eslint-disable react/jsx-sort-props */}
                <div
                  className={`${
                    results.openai.success ? 'bg-green-500' : 'bg-red-500'
                  } mt-0.5 h-4 w-4 flex-shrink-0 rounded-full`}
                ></div>
                {/* eslint-enable react/jsx-sort-props */}
                <div>
                  <div className="font-medium">OpenAI API</div>
                  <div className="text-xs text-gray-600">{results.openai.message}</div>
                </div>
              </div>
            </div>
          )}

          {!results && !loading && (
            <p className="text-xs text-gray-500">
              「テスト実行」ボタンをクリックして接続状態を確認してください
            </p>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
