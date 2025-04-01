import path from 'path';

import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

import logger from '../../utils/logger';
import { Database } from '../types/supabase';

// .env.localファイルを読み込む
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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
export async function testSupabaseConnection() {
  try {
    // 本当に基本的なクエリ - 健全性チェックのみ
    const { data, error } = await SUPABASE.from('users').select('*').limit(1);

    if (error) {
      logger.error('Supabase接続エラー:', error.message);
      logger.error('エラー詳細:', error);
      return false;
    }

    // データの有無にかかわらず接続成功とみなす
    logger.info(`Supabase接続成功 - データ: ${data ? JSON.stringify(data) : '(データなし)'}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Supabase接続テスト中に例外が発生:', error.message);
      logger.error('例外スタック:', error.stack);
    } else {
      logger.error('Supabase接続テスト中に不明な例外が発生:', error);
    }
    return false;
  }
}
