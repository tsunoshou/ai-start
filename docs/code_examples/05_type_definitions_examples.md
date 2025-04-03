# 型定義コード例集

最終更新日: 2025-03-26

このドキュメントは[「05_type_definitions.md」](../05_type_definitions.md)で説明されている型定義の具体的な実装例を提供します。「05_type_definitions.md」が概念と原則を説明するのに対し、このファイルは実際のコード例を集約しています。

## 目次

- [基本・汎用ユーティリティ型の実装例](#基本汎用ユーティリティ型の実装例)
- [ドメインモデル型定義の実装例](#ドメインモデル型定義の実装例)
- [API DTOの型定義実装例](#api-dtoの型定義実装例)
- [データエンティティ型定義の実装例](#データエンティティ型定義の実装例)
- [状態管理関連の型定義実装例](#状態管理関連の型定義実装例)
- [ユーティリティ型の実装例](#ユーティリティ型の実装例)

## 基本・汎用ユーティリティ型の実装例

### 共通基本型

```typescript
// types/common/basic.ts

/**
 * 日付関連の基本型定義
 * アプリケーション全体で日付表現を統一するための型
 */

/** ISO形式の日付時刻文字列型 */
export type ISODateTimeString = string;

/** YYYY-MM-DD形式の日付型 */
export type DateOnlyString = string;

/** タイムスタンプ型（Dateオブジェクト） */
export type Timestamp = Date;

/**
 * ドメイン固有の値オブジェクト
 * 型安全性を高めるためのブランド型
 */

/** メールアドレス型（ブランド型） */
export type Email = string & { readonly __brand: unique symbol };

/** パスワード型 */
export type Password = string;

/** 進捗率型（0-100の数値） */
export type PercentageProgress = number;

/** ID型（文字列ベース、型安全性のためのブランド型） */
export type ID = string & { readonly __brand: unique symbol };
```

### 共通オブジェクト型

```typescript
// types/common/objects.ts

import { ISODateTimeString, ID } from './basic';

/**
 * ベースエンティティ
 * すべてのエンティティが持つ共通プロパティの定義
 */
export type BaseEntity = {
  id: ID;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};

/**
 * ページネーション関連の型定義
 */
export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

/**
 * フィルター/ソート関連の型定義
 */
export type SortDirection = 'asc' | 'desc';

export type SortParams<T> = {
  field: keyof T;
  direction: SortDirection;
};

export type FilterOperator =
  | 'eq' // =
  | 'neq' // !=
  | 'gt' // >
  | 'gte' // >=
  | 'lt' // <
  | 'lte' // <=
  | 'in' // IN ()
  | 'nin' // NOT IN ()
  | 'like'; // LIKE

export type FilterParams<T> = {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
};
```

## ドメインモデル型定義の実装例

### ユーザードメインモデル

```typescript
// types/domain/models/user.ts

import { Email, ID, DateOnlyString, Timestamp } from '../../common/basic';

/**
 * ユーザー認証情報を表すモデル
 * 認証に必要な最小限の情報のみを含む
 */
export type UserAuthInfo = {
  id: ID;
  email: Email;
  isVerified: boolean;
  lastLoginAt: Timestamp | null;
};

/**
 * ユーザープロファイル情報を表すモデル
 */
export type UserProfile = {
  displayName: string;
  biography: string | null;
  avatarUrl: string | null;
  birthDate: DateOnlyString | null;
  location: string | null;
  preferredLanguage: string;
};

/**
 * ユーザードメインモデル
 * ビジネスロジックで扱うユーザーの完全な表現
 */
export type User = UserAuthInfo &
  UserProfile & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    roles: UserRole[];
    settings: UserSettings;
  };

/**
 * ユーザーロール
 * システム内でのユーザーの権限を定義
 */
export type UserRole = 'USER' | 'ADMIN' | 'EDITOR';

/**
 * ユーザー設定
 * ユーザーの個人設定を表現
 */
export type UserSettings = {
  notifications: {
    email: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  timezone: string;
};
```

### AIプロンプトドメインモデル

```typescript
// types/domain/models/ai-prompt.ts

import { ID, Timestamp } from '../../common/basic';

/**
 * AIプロンプトカテゴリ
 * プロンプトの分類を表現
 */
export type PromptCategory =
  | 'GENERAL'
  | 'CREATIVE_WRITING'
  | 'BUSINESS'
  | 'PROGRAMMING'
  | 'EDUCATION';

/**
 * AIモデルタイプ
 * 対応しているAIモデルの種類
 */
export type AIModelType = 'GPT_3_5' | 'GPT_4' | 'CLAUDE_3_SONNET' | 'CLAUDE_3_OPUS';

/**
 * プロンプト変数
 * プロンプトテンプレート内で置換される変数を定義
 */
export type PromptVariable = {
  name: string;
  description: string;
  defaultValue?: string;
  required: boolean;
};

/**
 * AIプロンプトドメインモデル
 * ユーザーが作成・使用するプロンプトの完全な表現
 */
export type AIPrompt = {
  id: ID;
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  compatibleModels: AIModelType[];
  variables: PromptVariable[];
  isPublic: boolean;
  creatorId: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
  averageRating: number | null;
};
```

## API DTOの型定義実装例

### ユーザーAPI DTOs

```typescript
// types/api/dtos/user.ts

import { DateOnlyString, ID } from '../../common/basic';
import { UserRole } from '../../domain/models/user';

/**
 * ユーザー登録リクエスト
 */
export type RegisterUserRequest = {
  email: string;
  password: string;
  displayName: string;
  agreeToTerms: boolean;
};

/**
 * ユーザー登録レスポンス
 */
export type RegisterUserResponse = {
  id: ID;
  email: string;
  displayName: string;
  createdAt: string;
  verificationEmailSent: boolean;
};

/**
 * ユーザーログインリクエスト
 */
export type LoginUserRequest = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/**
 * ユーザーログインレスポンス
 */
export type LoginUserResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfileResponse;
};

/**
 * ユーザープロファイルレスポンス
 */
export type UserProfileResponse = {
  id: ID;
  email: string;
  displayName: string;
  biography: string | null;
  avatarUrl: string | null;
  birthDate: DateOnlyString | null;
  location: string | null;
  roles: UserRole[];
  createdAt: string;
  lastLoginAt: string | null;
};

/**
 * ユーザープロファイル更新リクエスト
 */
export type UpdateUserProfileRequest = {
  displayName?: string;
  biography?: string | null;
  avatarUrl?: string | null;
  birthDate?: DateOnlyString | null;
  location?: string | null;
  preferredLanguage?: string;
};
```

### AIプロンプトAPI DTOs

```typescript
// types/api/dtos/ai-prompt.ts

import { AIModelType, PromptCategory, PromptVariable } from '../../domain/models/ai-prompt';
import { ID } from '../../common/basic';

/**
 * プロンプト作成リクエスト
 */
export type CreatePromptRequest = {
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  compatibleModels: AIModelType[];
  variables: PromptVariable[];
  isPublic: boolean;
};

/**
 * プロンプト更新リクエスト
 */
export type UpdatePromptRequest = {
  title?: string;
  description?: string;
  content?: string;
  category?: PromptCategory;
  compatibleModels?: AIModelType[];
  variables?: PromptVariable[];
  isPublic?: boolean;
};

/**
 * プロンプトレスポンス（詳細）
 */
export type PromptResponse = {
  id: ID;
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  compatibleModels: AIModelType[];
  variables: PromptVariable[];
  isPublic: boolean;
  creatorId: ID;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  averageRating: number | null;
  isFavorited: boolean;
};

/**
 * プロンプト一覧レスポンス（簡易）
 */
export type PromptListItemResponse = {
  id: ID;
  title: string;
  description: string;
  category: PromptCategory;
  compatibleModels: AIModelType[];
  creatorId: ID;
  creatorName: string;
  createdAt: string;
  usageCount: number;
  averageRating: number | null;
  isFavorited: boolean;
};

/**
 * プロンプト実行リクエスト
 */
export type ExecutePromptRequest = {
  promptId: ID;
  modelType: AIModelType;
  variables: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
};
```

## データエンティティ型定義の実装例

### データベースエンティティの型定義

```typescript
// types/data/entities/user.ts

import { BaseEntity } from '../../common/objects';

/**
 * ユーザーテーブルエンティティ
 * データベース上のユーザーテーブルと1:1で対応
 */
export type UserEntity = BaseEntity & {
  email: string;
  passwordHash: string;
  displayName: string;
  biography: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
  location: string | null;
  preferredLanguage: string;
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpiresAt: string | null;
  resetPasswordToken: string | null;
  resetPasswordTokenExpiresAt: string | null;
  lastLoginAt: string | null;
};

/**
 * ユーザーロールテーブルエンティティ
 * ユーザーとロールの多対多関係を表現
 */
export type UserRoleEntity = {
  userId: string;
  role: string;
  assignedAt: string;
};

/**
 * ユーザー設定テーブルエンティティ
 */
export type UserSettingsEntity = {
  userId: string;
  notificationEmail: boolean;
  notificationPush: boolean;
  theme: string;
  timezone: string;
  updatedAt: string;
};
```

```typescript
// types/data/entities/ai-prompt.ts

import { BaseEntity } from '../../common/objects';

/**
 * AIプロンプトテーブルエンティティ
 */
export type AIPromptEntity = BaseEntity & {
  title: string;
  description: string;
  content: string;
  category: string;
  compatibleModels: string; // JSON文字列
  variables: string; // JSON文字列
  isPublic: boolean;
  creatorId: string;
  usageCount: number;
  averageRating: number | null;
};

/**
 * プロンプトお気に入りテーブルエンティティ
 */
export type PromptFavoriteEntity = {
  userId: string;
  promptId: string;
  createdAt: string;
};

/**
 * プロンプト評価テーブルエンティティ
 */
export type PromptRatingEntity = {
  userId: string;
  promptId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### データベーススキーマ型定義

```typescript
// types/data/schema/schema.ts

import { InferModel } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  json,
  numeric,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * ユーザーテーブルスキーマ
 */
export const users = pgTable('users', {
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
 */
export const userRoles = pgTable('user_roles', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  role: varchar('role', { length: 50 }).notNull(),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
});

/**
 * AIプロンプトテーブルスキーマ
 */
export const aiPrompts = pgTable('ai_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  compatibleModels: json('compatible_models').notNull(),
  variables: json('variables').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => users.id),
  usageCount: numeric('usage_count').notNull().default('0'),
  averageRating: numeric('average_rating', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 型推論
export type User = InferModel<typeof users>;
export type UserRole = InferModel<typeof userRoles>;
export type AIPrompt = InferModel<typeof aiPrompts>;
```

## 状態管理関連の型定義実装例

### グローバル状態型定義

```typescript
// types/state/global-state.ts

import { ID } from '../common/basic';
import { User } from '../domain/models/user';

/**
 * 認証状態
 */
export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  error: string | null;
};

/**
 * テーマ設定状態
 */
export type ThemeState = {
  mode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
};

/**
 * 言語設定状態
 */
export type LanguageState = {
  currentLanguage: 'ja' | 'en';
  isRTL: boolean;
};

/**
 * トースト通知状態
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastNotification = {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  dismissible?: boolean;
};

export type ToastState = {
  notifications: ToastNotification[];
};

/**
 * グローバルアプリケーション状態
 */
export type GlobalState = {
  auth: AuthState;
  theme: ThemeState;
  language: LanguageState;
  toast: ToastState;
};
```

### コンポーネント状態型定義

```typescript
// types/state/component-state.ts

import { FilterParams, PaginationParams, SortParams } from '../common/objects';
import { AIPrompt } from '../domain/models/ai-prompt';
import { AIModelType, PromptCategory } from '../domain/models/ai-prompt';

/**
 * プロンプト一覧画面の状態
 */
export type PromptListState = {
  isLoading: boolean;
  prompts: AIPrompt[];
  totalPrompts: number;
  pagination: PaginationParams;
  sort: SortParams<AIPrompt>;
  filters: {
    search: string;
    categories: PromptCategory[];
    compatibleModels: AIModelType[];
    onlyFavorites: boolean;
    onlyMine: boolean;
  };
  error: string | null;
};

/**
 * プロンプト実行画面の状態
 */
export type PromptExecutionState = {
  prompt: AIPrompt | null;
  isLoading: boolean;
  selectedModel: AIModelType;
  variables: Record<string, string>;
  temperature: number;
  maxTokens: number;
  result: {
    isStreaming: boolean;
    content: string;
    error: string | null;
  };
};

/**
 * フォームステート共通型（汎用）
 */
export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
};
```

## ユーティリティ型の実装例

```typescript
// types/utils/type-utils.ts

/**
 * 部分的に必須プロパティを持つ型を作成
 * Partialの逆操作で、指定したプロパティのみを必須にする
 */
export type RequiredPick<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 特定のプロパティを除外して残りを必須にする型
 */
export type RequiredOmit<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

/**
 * 少なくとも1つのプロパティを持つ型を作成
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

/**
 * ディープ部分型（ネストされたオブジェクトにも対応）
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * 読み取り専用の深いネストを持つ型
 */
export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
    ? {
        readonly [P in keyof T]: DeepReadonly<T[P]>;
      }
    : T;

/**
 * 非nullableな型（nullとundefinedを除外）
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * レコード型のキーと値の型を入れ替える
 */
export type Invert<T extends Record<string, string>> = {
  [K in T[keyof T]]: keyof T extends infer U
    ? U extends keyof T
      ? T[U] extends K
        ? U
        : never
      : never
    : never;
};

/**
 * 列挙型から文字列のユニオン型を作成
 */
export type EnumToUnion<T extends Record<string, string | number>> = T[keyof T];

/**
 * オプショナルな関数パラメータ型
 */
export type OptionalParameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? Partial<P> extends P
    ? P
    : never
  : never;
```

## 相互参照

このドキュメントで示したコード例は、[「05_type_definitions.md」](../05_type_definitions.md)で説明されている型定義の設計原則と実装パターンの具体的な実装例です。型定義の概念的な理解や設計原則についての詳細は「05_type_definitions.md」を参照してください。

その他の関連ドキュメント:

- 実装ルールと命名規則の詳細については[「04_implementation_rules.md」](../04_implementation_rules.md)を参照してください。
- これらの型を使用するユーティリティ関数の実装例については[「06_utility_functions_examples.md」](code_examples/06_utility_functions_examples.md)を参照してください。
- アーキテクチャ設計の詳細については[「02_architecture_design.md」](../02_architecture_design.md)を参照してください。
