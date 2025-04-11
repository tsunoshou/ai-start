import { pgTable, varchar } from 'drizzle-orm/pg-core';

import { idColumn, timestampColumns } from '@core/shared/infrastructure/database/schema/_common';

/**
 * ユーザー情報を格納するテーブルスキーマ定義。
 */
export const users = pgTable('users', {
  /** ユーザーID (Primary Key, UUID) */
  ...idColumn,
  /** メールアドレス (Unique, Not Null) */
  email: varchar('email', { length: 255 }).notNull().unique(),
  /** ユーザー名 (Not Null) */
  name: varchar('name', { length: 50 }).notNull(),
  /** ハッシュ化されたパスワード (Not Null) */
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  /** 作成日時・更新日時 */
  ...timestampColumns,
});
