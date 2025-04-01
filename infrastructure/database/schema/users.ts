import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * ユーザーテーブルスキーマ
 *
 * ドキュメントで定義されている基本的なユーザー情報を格納するテーブル
 */
export const USERS = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  biography: text('biography'),
  avatarUrl: text('avatar_url'),
  birthDate: varchar('birth_date', { length: 10 }),
  location: varchar('location', { length: 100 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('ja'),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpiresAt: timestamp('verification_token_expires_at'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordTokenExpiresAt: timestamp('reset_password_token_expires_at'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * ユーザーロールテーブルスキーマ
 *
 * ユーザーに割り当てられた役割（ロール）を管理するテーブル
 */
export const USER_ROLES = pgTable('user_roles', {
  userId: uuid('user_id')
    .notNull()
    .references(() => USERS.id),
  role: varchar('role', { length: 50 }).notNull(),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
});

// 型推論エクスポート
export type User = typeof USERS.$inferSelect;
export type NewUser = typeof USERS.$inferInsert;

export type UserRole = typeof USER_ROLES.$inferSelect;
export type NewUserRole = typeof USER_ROLES.$inferInsert;
