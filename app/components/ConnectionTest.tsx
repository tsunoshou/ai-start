/* eslint-disable react/jsx-sort-props */
'use client';

import { useCallback, useEffect, useState } from 'react';

interface StatusData {
  postgres: {
    envVars: {
      success: boolean;
      message: string;
    };
    connection: {
      success: boolean;
      message: string;
    };
  };
  supabase: {
    envVars: {
      success: boolean;
      message: string;
    };
    connection: {
      success: boolean;
      message: string;
    };
  };
  nodeEnv: string;
  timestamp: string;
}

/**
 * ステータス表示用の赤いバッジ
 */
function ErrorBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      エラー
    </span>
  );
}

/**
 * ステータス表示用の緑のバッジ
 */
function SuccessBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
      OK
    </span>
  );
}

/**
 * 接続テスト用コンポーネント
 */
export default function ConnectionTest() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 接続状態を取得する関数
   */
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/db-status');
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // コンポーネントマウント時に接続状態を取得
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return <div className="rounded-md border bg-gray-50 p-4">接続状態を確認中...</div>;
  }

  if (error) {
    return (
      <div className="rounded-md border bg-red-50 p-4 text-red-700">
        <p className="font-bold">エラーが発生しました</p>
        <p>{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 hover:bg-red-50"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!status) {
    return <div className="rounded-md border bg-gray-50 p-4">接続情報なし</div>;
  }

  return (
    <div className="rounded-md border bg-gray-50 p-4">
      <h3 className="mb-4 text-lg font-bold">システム接続状況</h3>

      <div className="mb-3">
        <div className="mb-1 font-medium">Postgres DB:</div>
        <div className="ml-4 flex flex-col gap-1">
          <div>
            環境変数: {status.postgres.envVars.success ? <SuccessBadge /> : <ErrorBadge />}{' '}
            <span className="text-sm">{status.postgres.envVars.message}</span>
          </div>
          <div>
            接続テスト: {status.postgres.connection.success ? <SuccessBadge /> : <ErrorBadge />}{' '}
            <span className="text-sm">{status.postgres.connection.message}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 font-medium">Supabase:</div>
        <div className="ml-4 flex flex-col gap-1">
          <div>
            環境変数: {status.supabase.envVars.success ? <SuccessBadge /> : <ErrorBadge />}{' '}
            <span className="text-sm">{status.supabase.envVars.message}</span>
          </div>
          <div>
            接続テスト: {status.supabase.connection.success ? <SuccessBadge /> : <ErrorBadge />}{' '}
            <span className="text-sm">{status.supabase.connection.message}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <div>環境: {status.nodeEnv}</div>
        <div>最終更新: {new Date(status.timestamp).toLocaleString()}</div>
      </div>

      <button
        onClick={fetchStatus}
        className="mt-3 rounded-md border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50"
      >
        更新
      </button>
    </div>
  );
}
