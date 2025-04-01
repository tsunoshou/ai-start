import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { createClient } from '@supabase/supabase-js';

import logger from '../../utils/logger';
import { Database } from '../types/supabase';

// 環境変数からSupabase接続情報を取得
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
 * フィルタ処理をラップして安全に実行するヘルパー関数
 * @param query Postgrestクエリビルダー
 * @param column フィルタ対象のカラム
 * @param operator 比較演算子
 * @param value 比較値
 * @returns フィルタ適用後のクエリビルダー
 */
export function safeFilter<T, K extends Record<string, unknown>>(
  query: PostgrestFilterBuilder<T, K, T>,
  column: string,
  operator: string,
  value: unknown
): PostgrestFilterBuilder<T, K, T> {
  // 値のタイプに応じた適切な処理
  if (typeof value === 'string') {
    value = escapeValue(value);
  }

  // 演算子に応じたフィルタを適用
  switch (operator) {
    case 'eq':
      return query.eq(column, value);
    case 'neq':
      return query.neq(column, value);
    case 'gt':
      return query.gt(column, value);
    case 'gte':
      return query.gte(column, value);
    case 'lt':
      return query.lt(column, value);
    case 'lte':
      return query.lte(column, value);
    case 'in':
      return query.in(column, Array.isArray(value) ? value : [value]);
    case 'like':
      return query.like(column, `%${value}%`);
    default:
      return query.eq(column, value);
  }
}

/**
 * データベース接続テスト用の関数
 * @returns 接続成功時はtrue、失敗時はfalse
 */
export async function testSupabaseConnection() {
  try {
    const { error } = await SUPABASE.from('users').select('count()', {
      count: 'exact',
      head: true,
    });

    if (error) {
      logger.error('Supabase接続エラー:', error.message);
      return false;
    }

    logger.info('Supabase接続成功');
    return true;
  } catch (error) {
    logger.error('Supabase接続テスト中に例外が発生:', error);
    return false;
  }
}
