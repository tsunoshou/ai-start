import { createClient } from '@supabase/supabase-js';

import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  isStaging,
  isProduction,
} from '../../../config/environment';

/**
 * 現在の環境に適したSupabaseクライアントを作成する
 * 環境変数に基づいて適切なURLとキーを使用
 * @returns Supabaseクライアント
 */
export function createEnvironmentClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * 管理者権限を持つSupabaseクライアントを作成する
 * サービスロールキーを使用するため、サーバーサイドでのみ使用すること
 * @returns 管理者権限のSupabaseクライアント
 */
export function createAdminClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
    },
  });
}

/**
 * 環境名を取得する
 * @returns 環境名（日本語）
 */
export function getEnvironmentName(): string {
  if (isProduction()) {
    return '本番環境';
  } else if (isStaging()) {
    return 'ステージング環境';
  } else {
    return '開発環境';
  }
}

/**
 * 環境名を取得する
 * @returns 環境名（英語）
 */
export function getEnvironmentNameEn(): string {
  if (isProduction()) {
    return 'production';
  } else if (isStaging()) {
    return 'staging';
  } else {
    return 'development';
  }
}
