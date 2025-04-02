/**
 * データベース接続に関する共通定数
 * 接続パラメータを一元管理するためのファイル
 */

/**
 * 接続プール設定用の型定義
 */
type ConnectionPoolConfig = {
  DIRECT_MAX_CONNECTIONS: number;
  POOLER_MAX_CONNECTIONS: number;
  IDLE_TIMEOUT: {
    DIRECT: number;
    POOLER: number;
  };
  CONNECT_TIMEOUT: number;
  MAX_LIFETIME: {
    DIRECT: number;
    POOLER: number;
  };
  PREPARE: {
    DIRECT: boolean;
    POOLER: boolean;
  };
};

/**
 * 接続プール設定
 * 環境や接続タイプに基づいて調整される値
 */
export const CONNECTION_POOL: ConnectionPoolConfig = {
  // 最大接続数
  DIRECT_MAX_CONNECTIONS: 10,
  POOLER_MAX_CONNECTIONS: 20,

  // タイムアウト設定（秒単位）
  IDLE_TIMEOUT: {
    DIRECT: 30,
    POOLER: 20,
  },

  // 接続タイムアウト（秒単位）
  CONNECT_TIMEOUT: 15,

  // 接続の最大寿命（秒単位）
  MAX_LIFETIME: {
    DIRECT: 60 * 30, // 30分
    POOLER: 60 * 10, // 10分
  },

  // プリペアドステートメント設定
  PREPARE: {
    DIRECT: true,
    POOLER: false,
  },
} as const;

/**
 * 接続プーラー検出用の型定義
 */
type PoolerDetectionConfig = {
  STRINGS: readonly string[];
};

/**
 * 接続プーラー検出用の文字列
 */
export const POOLER_DETECTION: PoolerDetectionConfig = {
  STRINGS: ['pooler.supabase.com', 'pgbouncer=true'],
} as const;

/**
 * 接続URLがプーラー形式かどうかを確認する関数
 * @param url 接続URL
 * @returns プーラー接続の場合はtrue
 */
export function isPoolerUrl(url: string): boolean {
  return POOLER_DETECTION.STRINGS.some((str) => url.includes(str));
}
