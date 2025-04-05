# 型定義コード例集

**最終更新日:** 2025-04-03

このドキュメントは`05_type_definitions.md`で説明されている型定義の具体的な実装例を提供します。「05_type_definitions.md」が概念と原則を説明するのに対し、このファイルは実際のコード例を集約しています。

## 目次

- [基本・汎用ユーティリティ型の実装例](#基本汎用ユーティリティ型の実装例)
- [ドメインモデル Value Object/Entity の実装例](#ドメインモデル-value-objectentity-の実装例)
- [API DTOの型定義実装例](#api-dtoの型定義実装例)
- [データ永続化モデル (Drizzle Schema) の例](#データ永続化モデル-drizzle-schema-の例)
- [状態管理関連の型定義実装例](#状態管理関連の型定義実装例)
- [ユーティリティ型の実装例](#ユーティリティ型の実装例)

## 基本・汎用ユーティリティ型の実装例

### 共通基本型

```typescript
// src/shared/types/common.ts (例：パスはプロジェクト構成に依存)

/**
 * 日付関連の基本型定義。
 * アプリケーション全体で日付表現を統一するための型。
 */

/** ISO 8601形式の日付時刻文字列型 */
export type ISODateTimeString = string;

/** YYYY-MM-DD形式の日付文字列型 */
export type DateOnlyString = string;

/** JavaScriptのDateオブジェクト */
export type Timestamp = Date;

/**
 * 識別子を表す基本型。
 * UUIDやCUIDなどの文字列形式を想定。
 * より型安全性を高める場合はドメイン層でValue Object (例: UserId) を使用する。
 */
export type Identifier = string;

/** パーセンテージ (0-100) */
export type Percentage = number;
```

### 共通オブジェクト型

```typescript
// src/shared/types/common.ts (続き)

import { ISODateTimeString, Identifier } from './common';

/**
 * 多くのエンティティが持つ基本プロパティ。
 * ドメインエンティティの基底クラスやインターフェースで使用されることを想定。
 */
export interface BaseDomainEntity {
  // IDは各エンティティのValue Object (e.g., UserId, ProductId) で定義される
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

/**
 * ページネーションリクエストのパラメータ
 */
export interface PaginationParams {
  page: number; // 1始まりのページ番号
  limit: number; // 1ページあたりのアイテム数
}

/**
 * ページネーションされたレスポンスデータ
 * @template T - リストされるアイテムの型
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** ソート方向 */
export type SortDirection = 'asc' | 'desc';

/**
 * ソートパラメータ
 * @template T - ソート対象のオブジェクト型
 */
export interface SortParams<T> {
  field: keyof T;
  direction: SortDirection;
}

/** フィルタリング演算子 */
export type FilterOperator = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'in' | 'nin' | 'like' | 'ilike' // ilike: case-insensitive like
  | 'isNull' | 'isNotNull';

/**
 * フィルタリングパラメータ
 * @template T - フィルタリング対象のオブジェクト型
 */
export interface FilterParams<T> {
  field: keyof T;
  operator: FilterOperator;
  value?: unknown; // isNull, isNotNull では不要
}
```

## ドメインモデル Value Object/Entity の実装例

### Value Objects (値オブジェクト)

```typescript
// src/domain/models/value-objects/user-id.ts
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { Result, ok, err } from 'neverthrow';

// Opaque Type / Nominal Typing を実現するヘルパー
type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;

/**
 * UserId を生成するファクトリ関数。
 * 不変条件: 有効なUUID v4であること。
 * @param {string} [value] - 既存のID文字列。省略時は新規生成。
 * @returns {Result<UserId, Error>} 生成結果またはエラー
 */
export function createUserId(value?: string): Result<UserId, Error> {
  const id = value ?? uuidv4();
  if (!uuidValidate(id)) {
    return err(new Error('Invalid UserId format (must be UUID v4).'));
  }
  return ok(id as UserId);
}

// src/domain/models/value-objects/email.ts
import { z } from 'zod';
// type Brand<K, T> = K & { __brand: T }; // 上記で定義済み or 共通化

export type Email = Brand<string, 'Email'>;

const emailSchema = z.string().email({ message: "Invalid email format." });

/**
 * Email を生成するファクトリ関数。
 * 不変条件: 有効なメールアドレス形式であること。
 * @param {string} value - メールアドレス文字列
 * @returns {Result<Email, Error>} 生成結果またはエラー
 */
export function createEmail(value: string): Result<Email, Error> {
  const validationResult = emailSchema.safeParse(value);
  if (!validationResult.success) {
    return err(new Error(validationResult.error.errors[0]?.message || 'Invalid email format.'));
  }
  return ok(validationResult.data as Email);
}
```

### User Entity (ユーザーエンティティ)

```typescript
// src/domain/models/entities/user.ts

import { Result, ok, err } from 'neverthrow';
import { UserId, createUserId } from '../value-objects/user-id';
import { Email, createEmail } from '../value-objects/email';
import { Password } from '../value-objects/password'; // Password VOも定義推奨
import { UserRole } from '../enums/user-role.enum'; // Enumも定義推奨
import { UserSettings } from '../value-objects/user-settings'; // Settings VOも定義推奨

/**
 * ユーザーエンティティのプロパティ
 */
export interface UserProps {
  readonly id: UserId;
  name: string;
  email: Email;
  passwordHash: string; // Password VOから取得したハッシュ値
  roles: UserRole[];
  settings: UserSettings;
  isVerified: boolean;
  lastLoginAt?: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;
  // プロフィール関連は別エンティティ (UserProfile) やVOに切り出すことも検討
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
}

/**
 * ユーザーエンティティ
 * ファクトリメソッドやビジネスロジックを持つクラスとして実装
 */
export class User {
  private props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  /**
   * 新規ユーザー作成 (ファクトリメソッド)
   * @param data - 作成に必要なデータ
   * @returns {Result<User, Error>} 作成結果またはエラー
   */
  public static create(data: {
    name: string;
    email: string;
    rawPassword: string; // 生パスワード
    roles?: UserRole[];
  }): Result<User, Error> {
    const userIdResult = createUserId();
    if (userIdResult.isErr()) return err(userIdResult.error);

    const emailResult = createEmail(data.email);
    if (emailResult.isErr()) return err(emailResult.error);

    // Password VOでハッシュ化処理を行う想定
    const passwordResult = Password.create(data.rawPassword);
    if (passwordResult.isErr()) return err(passwordResult.error);
    const passwordHash = passwordResult.value.getHashedValue();

    const now = new Date();
    const props: UserProps = {
      id: userIdResult.value,
      name: data.name,
      email: emailResult.value,
      passwordHash,
      roles: data.roles ?? [UserRole.USER], // デフォルトロール
      settings: UserSettings.getDefault(), // デフォルト設定
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    // ここでドメインイベントを発行することも可能 (UserCreatedEvent)

    return ok(new User(props));
  }

  /**
   * 永続化層からの再構築 (ファクトリメソッド)
   * @param props - DBなどから取得したプロパティ
   * @returns {User} 再構築されたUserインスタンス
   */
  public static reconstitute(props: UserProps): User {
    // バリデーションは省略（DBからのデータは信頼できる前提、または別途実施）
    return new User(props);
  }

  // --- ゲッター --- 
  get id(): UserId { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): Email { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get roles(): UserRole[] { return [...this.props.roles]; } // イミュータブルに
  get settings(): UserSettings { return this.props.settings; } // VOはイミュータブル前提
  get isVerified(): boolean { return this.props.isVerified; }
  get lastLoginAt(): Date | null | undefined { return this.props.lastLoginAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // --- ビジネスロジックメソッド --- 

  /** メールアドレスを変更する */
  public changeEmail(newEmailValue: string): Result<void, Error> {
    const emailResult = createEmail(newEmailValue);
    if (emailResult.isErr()) {
      return err(emailResult.error);
    }
    if (this.props.email !== emailResult.value) {
        this.props.email = emailResult.value;
        this.props.isVerified = false; // メール変更時は未検証に
        this.markAsUpdated();
        // Domain Event: UserEmailChanged
    }
    return ok(undefined);
  }

  /** パスワードを変更する */
  public changePassword(newRawPassword: string): Result<void, Error> {
    const passwordResult = Password.create(newRawPassword);
    if (passwordResult.isErr()) return err(passwordResult.error);
    
    this.props.passwordHash = passwordResult.value.getHashedValue();
    this.markAsUpdated();
    // Domain Event: UserPasswordChanged
    return ok(undefined);
  }

  /** ロールを追加する */
  public addRole(role: UserRole): void {
    if (!this.props.roles.includes(role)) {
      this.props.roles.push(role);
      this.markAsUpdated();
      // Domain Event: UserRoleAdded
    }
  }

  /** ユーザーを検証済みにする */
  public verify(): void {
    if (!this.props.isVerified) {
        this.props.isVerified = true;
        this.markAsUpdated();
        // Domain Event: UserVerified
    }
  }

  /** 最終ログイン日時を更新 */
  public updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    // 最終ログインはupdatedAtを更新しない場合もある
  }

  // --- ヘルパー --- 
  private markAsUpdated(): void {
    this.props.updatedAt = new Date();
  }
}
```

### AI Prompt Entity (AIプロンプトエンティティ)

```typescript
// src/domain/models/entities/ai-prompt.ts
// (Userエンティティと同様の構造で実装。Value Object, Enumを含む)

import { PromptId } from '../value-objects/prompt-id';
import { PromptCategory } from '../enums/prompt-category.enum';
import { AIModelType } from '../enums/ai-model-type.enum';
import { PromptVariable } from '../value-objects/prompt-variable';
import { UserId } from '../value-objects/user-id';

export interface AIPromptProps {
  readonly id: PromptId;
  title: string;
  description: string;
  content: string; // プロンプト本文
  category: PromptCategory;
  compatibleModels: AIModelType[];
  variables: PromptVariable[];
  isPublic: boolean;
  creatorId: UserId;
  readonly createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  averageRating: number | null; // 0-5など
}

export class AIPrompt {
  private props: AIPromptProps;

  private constructor(props: AIPromptProps) {
    this.props = props;
  }

  // ファクトリメソッド (create, reconstitute) ...

  // ゲッター ...

  // ビジネスロジック (例: レーティング更新、公開/非公開切り替え) ...
}
```

## API DTOの型定義実装例

### ユーザーAPI DTOs

```typescript
// src/interfaces/http/rest/v1/dtos/user.dto.ts (例：パスはプロジェクト構成に依存)

import { z } from 'zod'; // バリデーションライブラリとしてZodを使用
import { UserRole } from '@/domain/models/enums/user-role.enum';

// POST /api/v1/users - ユーザー登録リクエストボディ
export const CreateUserRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
export type CreateUserRequestDto = z.infer<typeof CreateUserRequestSchema>;

// GET /api/v1/users/{userId} - ユーザー情報レスポンス
export const UserResponseSchema = z.object({
  id: z.string().uuid(), // UserId VOではなくstring (UUID)
  name: z.string(),
  email: z.string().email(), // Email VOではなくstring
  roles: z.array(z.nativeEnum(UserRole)),
  isVerified: z.boolean(),
  lastLoginAt: z.date().nullable().optional(),
  createdAt: z.date(), // Dateオブジェクトをそのまま or ISODateTimeString
  updatedAt: z.date(),
  settings: z.object({ // Settings VOの内容を展開
    theme: z.enum(['light', 'dark', 'system']),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
    }),
    timezone: z.string(),
  }),
  // プロフィール情報も含む場合
  displayName: z.string().optional(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UserResponseDto = z.infer<typeof UserResponseSchema>;

// PUT /api/v1/users/{userId}/profile - プロフィール更新リクエスト
export const UpdateUserProfileRequestSchema = z.object({
    displayName: z.string().max(100).optional(),
    bio: z.string().max(500).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateUserProfileRequestDto = z.infer<typeof UpdateUserProfileRequestSchema>;
```

### AIプロンプトAPI DTOs

```typescript
// src/interfaces/http/rest/v1/dtos/ai-prompt.dto.ts

import { z } from 'zod';
import { PromptCategory } from '@/domain/models/enums/prompt-category.enum';
import { AIModelType } from '@/domain/models/enums/ai-model-type.enum';

// プロンプト変数 DTO スキーマ
const PromptVariableDtoSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  defaultValue: z.string().optional(),
  required: z.boolean(),
});

// POST /api/v1/prompts - AIプロンプト作成リクエスト
export const CreateAIPromptRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  content: z.string().min(10),
  category: z.nativeEnum(PromptCategory),
  compatibleModels: z.array(z.nativeEnum(AIModelType)).min(1),
  variables: z.array(PromptVariableDtoSchema).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});
export type CreateAIPromptRequestDto = z.infer<typeof CreateAIPromptRequestSchema>;

// GET /api/v1/prompts/{promptId} - AIプロンプト詳細レスポンス
export const AIPromptResponseSchema = z.object({
  id: z.string().uuid(), // PromptId VOではなくstring (UUID)
  title: z.string(),
  description: z.string(),
  content: z.string(),
  category: z.nativeEnum(PromptCategory),
  compatibleModels: z.array(z.nativeEnum(AIModelType)),
  variables: z.array(PromptVariableDtoSchema),
  isPublic: z.boolean(),
  creatorId: z.string().uuid(), // UserId VOではなくstring
  createdAt: z.date(), // or ISODateTimeString
  updatedAt: z.date(), // or ISODateTimeString
  usageCount: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5).nullable(),
});
export type AIPromptResponseDto = z.infer<typeof AIPromptResponseSchema>;

// GET /api/v1/prompts - AIプロンプト一覧取得クエリパラメータ
export const ListAIPromptsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional().default('createdAt'), // 例: 'title', 'usageCount', 'averageRating'
  sortDirection: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.nativeEnum(PromptCategory).optional(),
  model: z.nativeEnum(AIModelType).optional(),
  search: z.string().optional(), // タイトルや説明での検索
  creatorId: z.string().uuid().optional(),
  isPublic: z.coerce.boolean().optional(),
});
export type ListAIPromptsQueryDto = z.infer<typeof ListAIPromptsQuerySchema>;

// GET /api/v1/prompts - AIプロンプト一覧レスポンス
// PaginatedResponse を利用 (src/shared/types/common.ts で定義)
// export type ListAIPromptsResponseDto = PaginatedResponse<AIPromptResponseDto>;
```

## データ永続化モデル (Drizzle Schema) の例

**注意:** このセクションのコードは、ORM (Drizzle) のスキーマ定義ファイル (`src/infrastructure/database/drizzle/schema.ts` など) に記述される内容の**例**です。このドキュメントファイル自体に記述するものではありません。

```typescript
// src/infrastructure/database/drizzle/schema.ts (例)

import { pgTable, text, uuid, timestamp, boolean, varchar, integer, real, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// -- Enums (PostgreSQLのENUM型を使う場合) --
// import { pgEnum } from 'drizzle-orm/pg-core';
// export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN', 'EDITOR']);
// export const promptCategoryEnum = pgEnum('prompt_category', ['GENERAL', 'CREATIVE_WRITING', ...]);
// export const aiModelTypeEnum = pgEnum('ai_model_type', ['GPT_3_5', 'GPT_4', ...]);

// -- Users Table --
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // roles: userRoleEnum('roles').array().notNull().default(sql`ARRAY['USER']::user_role[]`), // Enum配列を使う場合
  roles: text('roles').array().notNull().default(['USER']), // TEXT配列で代用する場合
  isVerified: boolean('is_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // プロフィール情報 (usersテーブルに含める場合)
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'), // URL or storage path
});

// -- User Settings Table (別テーブルにする場合) --
export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  theme: varchar('theme', { length: 50 }).default('system').notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  pushNotifications: boolean('push_notifications').default(false).notNull(),
  timezone: varchar('timezone', { length: 100 }).default('UTC').notNull(),
  language: varchar('language', { length: 10 }).default('ja').notNull(),
});

// -- AI Prompts Table --
export const aiPrompts = pgTable('ai_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  // category: promptCategoryEnum('category').notNull(), // Enumを使う場合
  category: varchar('category', { length: 50 }).notNull(), // VARCHARで代用する場合
  // compatibleModels: aiModelTypeEnum('compatible_models').array().notNull(), // Enum配列を使う場合
  compatibleModels: text('compatible_models').array().notNull(), // TEXT配列で代用する場合
  // variables: jsonb('variables'), // JSONB型で変数を格納する場合
  isPublic: boolean('is_public').default(false).notNull(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }), // 作成者が削除されてもプロンプトは残す場合
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  averageRating: real('average_rating'), // 浮動小数点数
}, (table) => ({
    // インデックス例
    creatorIdx: uniqueIndex('prompt_creator_idx').on(table.creatorId),
    categoryIdx: uniqueIndex('prompt_category_idx').on(table.category),
}));

// -- Prompt Variables Table (別テーブルにする場合) --
export const promptVariables = pgTable('prompt_variables', {
    id: uuid('id').defaultRandom().primaryKey(),
    promptId: uuid('prompt_id').references(() => aiPrompts.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description').notNull(),
    defaultValue: text('default_value'),
    required: boolean('required').default(true).notNull(),
}, (table) => ({
    // プロンプトIDと変数名でユニーク制約
    promptVarNameKey: primaryKey({ columns: [table.promptId, table.name] })
}));

// -- Relations (リレーション定義) --
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  createdPrompts: many(aiPrompts),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const aiPromptsRelations = relations(aiPrompts, ({ one, many }) => ({
  creator: one(users, {
    fields: [aiPrompts.creatorId],
    references: [users.id],
  }),
  variables: many(promptVariables),
}));

export const promptVariablesRelations = relations(promptVariables, ({ one }) => ({
    prompt: one(aiPrompts, {
        fields: [promptVariables.promptId],
        references: [aiPrompts.id],
    }),
}));

```

## 状態管理関連の型定義実装例

```typescript
// src/store/features/user/userSlice.ts (例：Redux Toolkit)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserResponseDto } from '@/interfaces/http/rest/v1/dtos/user.dto.ts';

export interface UserState {
  currentUser: UserResponseDto | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    fetchUserStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchUserSuccess(state, action: PayloadAction<UserResponseDto>) {
      state.currentUser = action.payload;
      state.isLoading = false;
    },
    fetchUserFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearUser(state) {
      state.currentUser = null;
    },
    updateUserSettingsOptimistic(state, action: PayloadAction<Partial<UserResponseDto['settings']>>) {
        if (state.currentUser) {
            state.currentUser.settings = { 
                ...state.currentUser.settings, 
                ...action.payload 
            };
        }
    },
  },
});

export const { 
    fetchUserStart, 
    fetchUserSuccess, 
    fetchUserFailure, 
    clearUser,
    updateUserSettingsOptimistic 
} = userSlice.actions;

export default userSlice.reducer;
```

## ユーティリティ型の実装例

### 型ガード関数

```typescript
// src/shared/utils/type-guards.ts

import { UserResponseDto } from '@/interfaces/http/rest/v1/dtos/user.dto.ts';
import { AIPromptResponseDto } from '@/interfaces/http/rest/v1/dtos/ai-prompt.dto.ts';

/**
 * UserResponseDto かどうかを判定する型ガード関数
 * @param obj - 判定対象のオブジェクト
 * @returns {obj is UserResponseDto} 型ガード結果
 */
export function isUserResponse(obj: unknown): obj is UserResponseDto {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  // 主要なプロパティの存在と型をチェック (より厳密なチェックも可能)
  return (
    'id' in obj && typeof obj.id === 'string' &&
    'email' in obj && typeof obj.email === 'string' &&
    'roles' in obj && Array.isArray(obj.roles) &&
    'settings' in obj && typeof obj.settings === 'object' && obj.settings !== null
  );
}

/**
 * AIPromptResponseDto かどうかを判定する型ガード関数
 * @param obj - 判定対象のオブジェクト
 * @returns {obj is AIPromptResponseDto} 型ガード結果
 */
export function isAIPromptResponse(obj: unknown): obj is AIPromptResponseDto {
    if (!obj || typeof obj !== 'object') {
        return false;
    }
    return (
        'id' in obj && typeof obj.id === 'string' &&
        'title' in obj && typeof obj.title === 'string' &&
        'content' in obj && typeof obj.content === 'string' &&
        'category' in obj && typeof obj.category === 'string' &&
        'creatorId' in obj && typeof obj.creatorId === 'string'
    );
}
```

### マッピング関数型

```typescript
// src/infrastructure/mappers/user.mapper.ts (型定義部分)

import { User as DomainUser } from '@/domain/models/entities/user';
import { users as PersistenceUser } from '@/infrastructure/database/drizzle/schema'; // Drizzle Schemaから生成される型
import { UserResponseDto } from '@/interfaces/http/rest/v1/dtos/user.dto.ts';

/** ドメインモデルから永続化モデルへのマッパー関数型 */
export type MapDomainToPersistence = (domainUser: DomainUser) => Omit<PersistenceUser, 'createdAt' | 'updatedAt' | 'id'> & { id?: string };

/** 永続化モデルからドメインモデルへのマッパー関数型 */
export type MapPersistenceToDomain = (persistenceUser: PersistenceUser) => DomainUser;

/** ドメインモデルからDTOへのマッパー関数型 */
export type MapDomainToDto = (domainUser: DomainUser) => UserResponseDto;

// DTOからドメインモデルへのマッピングは通常、ドメインのファクトリメソッドや
// アプリケーションサービス層で行われるため、独立したマッパー関数は少ない。
```

🦄