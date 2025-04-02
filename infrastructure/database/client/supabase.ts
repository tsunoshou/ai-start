import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { createClient } from '@supabase/supabase-js';

import { getSupabaseUrl, getSupabaseAnonKey } from '../../../config/environment';
import logger from '../../utils/logger';
import { Database } from '../types/supabase';

// 環境変数からSupabase接続情報を取得
const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

// 環境変数が設定されていない場合はエラーをスロー
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase環境変数が設定されていません');
}

/**
 * Supabaseクライアントのインスタンス
 * 型定義を適用してタイプセーフな操作を提供
 */
export const SUPABASE = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // SSRで使用する場合はcookieを有効化
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce',
  },
  global: {
    // カスタムフェッチ設定（タイムアウト付き）
    fetch: (url, options) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers,
          /* eslint-disable @typescript-eslint/naming-convention */
          'x-application-name': 'ai-start',
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      }).finally(() => clearTimeout(timeoutId));
    },
  },
  db: {
    schema: 'public',
  },
  // 接続の問題が発生した場合のリトライ設定
  realtime: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    params: { eventsPerSecond: 10 },
  },
});

/**
 * ユーザープロファイルをSupabaseから取得する関数
 * @param userId ユーザーID
 * @returns ユーザープロファイル情報
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await SUPABASE.from('users').select('*').eq('id', userId).single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * SQLインジェクション対策のためのエスケープ関数
 * @param value エスケープする値
 * @returns エスケープされた値
 */
export function escapeValue(value: string): string {
  // 基本的なエスケープ処理を実装
  return value.replace(/'/g, "''");
}

/**
 * フィルタリング操作で使用する値の型
 */
type FilterValue = string | number | boolean | null | Array<string | number | boolean | null>;

/**
 * 型安全なフィルタリング操作のためのヘルパー関数
 * PostgrestFilterBuilderに対して安全なフィルタリング操作を提供します
 *
 * @param query Postgrestクエリビルダー
 * @param column フィルタ対象のカラム
 * @param operator 比較演算子
 * @param value 比較値
 * @returns フィルタ適用後のクエリビルダー
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeFilter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: PostgrestFilterBuilder<any, any, any>,
  column: string,
  operator: string,
  value: FilterValue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): PostgrestFilterBuilder<any, any, any> {
  // 値のタイプに応じた適切な処理
  let processedValue = value;
  if (typeof value === 'string') {
    processedValue = escapeValue(value);
  }

  // 演算子に応じたフィルタを適用
  switch (operator) {
    case 'eq':
      return query.eq(column, processedValue);
    case 'neq':
      return query.neq(column, processedValue);
    case 'gt':
      return query.gt(column, processedValue);
    case 'gte':
      return query.gte(column, processedValue);
    case 'lt':
      return query.lt(column, processedValue);
    case 'lte':
      return query.lte(column, processedValue);
    case 'in':
      if (Array.isArray(processedValue)) {
        return query.in(column, processedValue);
      }
      return query.in(column, [processedValue]);
    case 'like':
      if (typeof processedValue === 'string') {
        return query.like(column, `%${processedValue}%`);
      }
      return query.eq(column, processedValue);
    default:
      return query.eq(column, processedValue);
  }
}

/**
 * データベース接続テスト用の関数
 * @returns 接続成功時はtrue、失敗時はfalse
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // 本当に基本的なクエリ - 健全性チェックのみ
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { error } = await SUPABASE.from('_health').select('*').limit(1);

    if (error) {
      logger.error('Supabase接続エラー:', error.message);
      return false;
    }

    logger.info('Supabase接続テスト成功');
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Supabase接続テスト中に例外が発生:', error.message);
    } else {
      logger.error('Supabase接続テスト中に不明な例外が発生:', error);
    }
    return false;
  }
}
