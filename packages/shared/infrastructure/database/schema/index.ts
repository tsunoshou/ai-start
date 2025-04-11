/**
 * データベーススキーマエクスポート
 *
 * すべてのテーブル定義を集約しエクスポートする
 */

// export * from './users'; // Removed users export
export * from '@core/user/infrastructure/database/schema/users.schema';

import { users } from '@core/user/infrastructure/database/schema/users.schema';
export { users };
