# 共通ユーティリティ関数のコード例

最終更新日: 2025-03-26

## 本ドキュメントの目的

このドキュメントは、「[06_utility_functions.md](../06_utility_functions.md)」で定義されている共通ユーティリティ関数の具体的な実装例を提供します。これらの例は、実際の実装において参考となるコードサンプルであり、プロジェクト全体の一貫性と品質を確保するための指針となります。

> **注意**: このドキュメントに含まれるコード例は、他のドキュメント（特に「05_type_definitions.md」で定義された型）に依存する場合があります。完全な実装には、それらの定義を参照してください。

## 目次

1. [モデル・エンティティ変換](#モデルエンティティ変換)
2. [API・モデル変換](#apiモデル変換)
3. [型安全な変換関数](#型安全な変換関数)
4. [入力バリデーション](#入力バリデーション)
5. [クライアント・サーバー共通バリデーション](#クライアントサーバー共通バリデーション)
6. [カスタムバリデーションルール](#カスタムバリデーションルール)
7. [日付操作](#日付操作)
8. [タイムゾーン処理](#タイムゾーン処理)
9. [フォーマット関数](#フォーマット関数)
10. [ログレベル・フォーマット](#ログレベルフォーマット)
11. [エラー型定義](#エラー型定義)
12. [エラーハンドリング方針](#エラーハンドリング方針)
13. [暗号化・復号化](#暗号化復号化)
14. [パスワード処理](#パスワード処理)
15. [トークン生成・検証](#トークン生成検証)
16. [テストデータ生成](#テストデータ生成)
17. [テスト用ユーティリティ](#テスト用ユーティリティ)
18. [実行時間測定](#実行時間測定)
19. [リソース使用状況測定](#リソース使用状況測定)
20. [プロンプト管理](#プロンプト管理)
21. [AI APIラッパー](#ai-apiラッパー)
22. [コンテキスト管理](#コンテキスト管理)
23. [翻訳管理](#翻訳管理)
24. [ロケール処理](#ロケール処理)
25. [多言語コンテンツ](#多言語コンテンツ)
26. [文字列操作](#文字列操作)
27. [配列・オブジェクト操作](#配列オブジェクト操作)
28. [数値計算](#数値計算)
29. [ユーティリティ関数の作成と拡張ガイドライン](#ユーティリティ関数の作成と拡張ガイドライン)

## モデル・エンティティ変換

### ドメインモデルとデータエンティティの双方向変換

```typescript
// src/utils/conversion/userMapper.ts
'use server';

import { User } from '@/types/domain/User';
import { UserEntity } from '@/types/entities/UserEntity';

/**
 * ユーザーエンティティをドメインモデルに変換する
 *
 * @param entity - 変換するユーザーエンティティ
 * @returns ドメインモデルに変換されたユーザー
 * @example
 * const userEntity = await db.query.users.findFirst({ where: eq(users.id, userId) });
 * const user = userEntityToDomain(userEntity);
 */
export function userEntityToDomain(entity: UserEntity): User {
  return {
    id: entity.id,
    email: entity.email,
    displayName: entity.display_name,
    role: entity.role,
    preferences: JSON.parse(entity.preferences || '{}'),
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    // 機密情報はドメインモデルに含めない
    hashedPassword: undefined,
  };
}

/**
 * ドメインモデルをユーザーエンティティに変換する
 *
 * @param user - 変換するユーザードメインモデル
 * @param preservePassword - 既存のパスワードハッシュを保持するかどうか
 * @returns エンティティに変換されたユーザー
 * @example
 * const updatedUserEntity = userDomainToEntity(user, true);
 * await db.update(users).set(updatedUserEntity).where(eq(users.id, user.id));
 */
export function userDomainToEntity(
  user: User,
  preservePassword = false
): Omit<UserEntity, 'hashed_password'> & { hashed_password?: string } {
  return {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    role: user.role,
    preferences: JSON.stringify(user.preferences || {}),
    created_at: user.createdAt,
    updated_at: new Date(),
    // パスワードはオプショナル
    ...(preservePassword && user.hashedPassword ? { hashed_password: user.hashedPassword } : {}),
  };
}
```

### 複雑なオブジェクトグラフの変換

```typescript
// src/utils/conversion/projectMapper.ts
'use server';

import { Project, Step } from '@/types/domain/Project';
import { ProjectEntity, StepEntity } from '@/types/entities/ProjectEntity';

/**
 * プロジェクトエンティティとその関連ステップをドメインモデルに変換する
 *
 * @param entity - プロジェクトエンティティ
 * @param stepEntities - 関連するステップエンティティの配列
 * @returns ドメインモデルに変換されたプロジェクトとステップ
 */
export function projectWithStepsEntityToDomain(
  entity: ProjectEntity,
  stepEntities: StepEntity[]
): Project {
  // ステップを変換してからプロジェクトに適用
  const steps = stepEntities
    .filter((step) => step.project_id === entity.id)
    .sort((a, b) => a.order - b.order)
    .map(stepEntityToDomain);

  return {
    id: entity.id,
    name: entity.name,
    description: entity.description || '',
    ownerId: entity.owner_id,
    status: entity.status,
    settings: JSON.parse(entity.settings || '{}'),
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
    steps: steps,
  };
}

/**
 * ステップエンティティをドメインモデルに変換する
 *
 * @param entity - ステップエンティティ
 * @returns ドメインモデルに変換されたステップ
 */
export function stepEntityToDomain(entity: StepEntity): Step {
  return {
    id: entity.id,
    projectId: entity.project_id,
    title: entity.title,
    description: entity.description || '',
    order: entity.order,
    type: entity.type,
    status: entity.status,
    content: JSON.parse(entity.content || '{}'),
    createdAt: entity.created_at,
    updatedAt: entity.updated_at,
  };
}
```

## APIモデル変換

### APIリクエスト変換

```typescript
// src/utils/conversion/apiRequestConverter.ts
'use server';

import { CreateProjectRequest } from '@/types/api/ProjectRequests';
import { Project } from '@/types/domain/Project';
import { validateCreateProject } from '@/utils/validation/projectValidation';

/**
 * プロジェクト作成リクエストをドメインモデルに変換する
 * バリデーションも同時に行い、無効な入力に対してはエラーをスローする
 *
 * @param request - API経由で受け取ったプロジェクト作成リクエスト
 * @param userId - 現在認証されているユーザーID
 * @returns バリデーション済みのプロジェクトドメインモデル
 * @throws ValidationError - 入力が無効な場合
 */
export function createProjectRequestToDomain(
  request: CreateProjectRequest,
  userId: string
): Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'steps'> {
  // まずリクエストの内容を検証
  const validatedData = validateCreateProject(request);

  // 検証済みデータでドメインモデルを構築
  return {
    name: validatedData.name,
    description: validatedData.description || '',
    ownerId: userId,
    status: 'active',
    settings: validatedData.settings || {},
  };
}
```

### APIレスポンス変換

```typescript
// src/utils/conversion/apiResponseConverter.ts
'use server';

import { ProjectResponse, ProjectSummaryResponse } from '@/types/api/ProjectResponses';
import { Project } from '@/types/domain/Project';
import { PaginationMetadata } from '@/types/api/Common';

/**
 * ドメインモデルからAPI応答形式に変換する
 * ユーザーの権限に基づいて表示するフィールドを調整する
 *
 * @param project - 変換するプロジェクトドメインモデル
 * @param isOwner - 閲覧者がプロジェクトの所有者かどうか
 * @returns API応答形式に変換されたプロジェクト
 */
export function projectDomainToResponse(project: Project, isOwner: boolean): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    // 所有者のみに表示する情報
    settings: isOwner ? project.settings : undefined,
    ownerId: project.ownerId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    steps: project.steps.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      order: step.order,
      type: step.type,
      status: step.status,
      // コンテンツの詳細は所有者のみに表示
      content: isOwner ? step.content : undefined,
      createdAt: step.createdAt.toISOString(),
      updatedAt: step.updatedAt.toISOString(),
    })),
  };
}

/**
 * プロジェクトリストをページネーション付きAPI応答形式に変換する
 *
 * @param projects - プロジェクトのリスト
 * @param total - 合計レコード数
 * @param page - 現在のページ番号
 * @param pageSize - ページあたりのアイテム数
 * @returns ページネーション情報付きのプロジェクトサマリーレスポンス
 */
export function projectsToPagedResponse(
  projects: Project[],
  total: number,
  page: number,
  pageSize: number
): {
  data: ProjectSummaryResponse[];
  pagination: PaginationMetadata;
} {
  const projectSummaries = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    stepCount: p.steps.length,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return {
    data: projectSummaries,
    pagination: {
      page,
      pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: page * pageSize < total,
      hasPreviousPage: page > 1,
    },
  };
}
```

## 型安全な変換関数

### 型ガード関数

```typescript
// src/utils/conversion/typeGuards.ts

import { Message, MessageType } from '@/types/domain/Message';
import { User, UserRole } from '@/types/domain/User';

/**
 * 値がMessageTypeのいずれかであるかを検証する型ガード
 *
 * @param value - 検証する値
 * @returns 値がMessageTypeのいずれかである場合はtrue
 * @example
 * if (isMessageType(type)) {
 *   // この中ではtypeはMessageType型として扱われる
 * }
 */
export function isMessageType(value: unknown): value is MessageType {
  return typeof value === 'string' && ['user', 'assistant', 'system', 'tool'].includes(value);
}

/**
 * 値がメッセージオブジェクトであるかを検証する型ガード
 *
 * @param value - 検証する値
 * @returns 値がMessage型の条件を満たす場合はtrue
 */
export function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.conversationId === 'string' &&
    isMessageType(obj.type) &&
    typeof obj.content === 'string' &&
    (obj.createdAt instanceof Date || typeof obj.createdAt === 'string')
  );
}

/**
 * 値が管理者ユーザーであるかを検証する型ガード
 *
 * @param user - 検証するユーザーオブジェクト
 * @returns ユーザーが管理者ロールを持つ場合はtrue
 * @example
 * if (isAdminUser(user)) {
 *   // 管理者権限が必要な処理
 * }
 */
export function isAdminUser(user: User): user is User & { role: 'admin' } {
  return user.role === 'admin';
}
```

### 型変換ヘルパー

```typescript
// src/utils/conversion/safeTypeConversion.ts

/**
 * nullまたはundefinedの可能性がある値を安全に処理する
 *
 * @param value - 変換する値
 * @param defaultValue - 値がnullまたはundefinedの場合に使用するデフォルト値
 * @returns 値またはデフォルト値
 * @example
 * const description = nullable(project.description, '説明なし');
 */
export function nullable<T>(value: T | null | undefined, defaultValue: T): T {
  return value === null || value === undefined ? defaultValue : value;
}

/**
 * オブジェクトから安全にプロパティ値を取得する
 *
 * @param obj - 対象オブジェクト
 * @param path - ドット区切りのプロパティパス
 * @param defaultValue - プロパティが存在しない場合のデフォルト値
 * @returns 取得した値またはデフォルト値
 * @example
 * const title = safeGet(data, 'step.content.title', '無題');
 */
export function safeGet<T>(
  obj: Record<string, any> | null | undefined,
  path: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;

  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }

  return result === null || result === undefined ? defaultValue : (result as T);
}

/**
 * 文字列型を数値型に安全に変換する
 *
 * @param value - 変換する文字列
 * @param defaultValue - 変換できない場合のデフォルト値
 * @returns 変換された数値またはデフォルト値
 * @example
 * const page = safeParseInt(req.query.page as string, 1);
 */
export function safeParseInt(value: string | null | undefined, defaultValue: number): number {
  if (value === null || value === undefined) return defaultValue;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
```

### 型拡張・変換関数

```typescript
// src/utils/conversion/typeTransformers.ts

/**
 * オブジェクトから指定されたプロパティのみを選択する
 * TypeScriptのPickユーティリティ型に相当する実行時関数
 *
 * @param obj - 元のオブジェクト
 * @param keys - 選択するプロパティキーの配列
 * @returns 選択されたプロパティのみを含む新しいオブジェクト
 * @example
 * const userBasic = pick(user, ['id', 'displayName', 'email']);
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      if (key in obj) {
        result[key] = obj[key];
      }
      return result;
    },
    {} as Pick<T, K>
  );
}

/**
 * オブジェクトから指定されたプロパティを除外する
 * TypeScriptのOmitユーティリティ型に相当する実行時関数
 *
 * @param obj - 元のオブジェクト
 * @param keys - 除外するプロパティキーの配列
 * @returns 指定プロパティを除いた新しいオブジェクト
 * @example
 * const publicUser = omit(user, ['hashedPassword', 'securityQuestions']);
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * オブジェクトの全プロパティをオプショナルにする
 * TypeScriptのPartialユーティリティ型に相当する実行時関数
 *
 * @param obj - 元のオブジェクト
 * @returns 全プロパティが存在する場合のみコピーされた新しいオブジェクト
 * @example
 * const partialUpdate = partial(userUpdateData);
 */
export function partial<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
    return result;
  }, {} as Partial<T>);
}
```

## 入力バリデーション

### Zodスキーマ定義

```typescript
// src/utils/validation/projectValidation.ts

import { z } from 'zod';
import { CreateProjectRequest, UpdateProjectRequest } from '@/types/api/ProjectRequests';
import { BaseError, ValidationError } from '@/utils/errors/AppErrors';

/**
 * プロジェクト作成リクエストのバリデーションスキーマ
 */
const createProjectSchema = z.object({
  name: z
    .string()
    .min(3, '名前は3文字以上である必要があります')
    .max(100, '名前は100文字以下である必要があります'),
  description: z.string().max(500, '説明は500文字以下である必要があります').optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * プロジェクト更新リクエストのバリデーションスキーマ
 */
const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, '名前は3文字以上である必要があります')
    .max(100, '名前は100文字以下である必要があります')
    .optional(),
  description: z.string().max(500, '説明は500文字以下である必要があります').optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * プロジェクト作成リクエストを検証する
 *
 * @param data - 検証するリクエストデータ
 * @returns 検証済みのデータ
 * @throws ValidationError - バリデーションエラー時
 */
export function validateCreateProject(
  data: CreateProjectRequest
): z.infer<typeof createProjectSchema> {
  try {
    return createProjectSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('プロジェクト作成リクエストが無効です', formatZodErrors(error));
    }
    throw new BaseError('予期せぬバリデーションエラーが発生しました');
  }
}

/**
 * プロジェクト更新リクエストを検証する
 *
 * @param data - 検証するリクエストデータ
 * @returns 検証済みのデータ
 * @throws ValidationError - バリデーションエラー時
 */
export function validateUpdateProject(
  data: UpdateProjectRequest
): z.infer<typeof updateProjectSchema> {
  try {
    return updateProjectSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('プロジェクト更新リクエストが無効です', formatZodErrors(error));
    }
    throw new BaseError('予期せぬバリデーションエラーが発生しました');
  }
}

/**
 * Zodエラーを整形された形式に変換する
 *
 * @param error - Zodエラーオブジェクト
 * @returns フィールド名をキーとするエラーメッセージマップ
 */
function formatZodErrors(error: z.ZodError): Record<string, string> {
  return error.errors.reduce(
    (acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );
}
```

## クライアント・サーバー共通バリデーション

### 共有バリデーションロジック

```typescript
// src/utils/validation/shared/messageValidation.ts

import { z } from 'zod';
import { isServerSide } from '@/utils/common/environment';

/**
 * メッセージ送信リクエストの共通バリデーションスキーマ
 * クライアントとサーバーの両方で使用する
 */
export const messageSendSchema = z.object({
  conversationId: z.string().uuid('会話IDは有効なUUID形式である必要があります'),
  content: z
    .string()
    .min(1, 'メッセージ内容は必須です')
    .max(isServerSide() ? 32000 : 16000, 'メッセージが長すぎます'),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'file', 'link']),
        name: z.string().min(1),
        content: z.string().optional(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * クライアント側での簡易バリデーション（実行環境に応じて動作調整）
 *
 * @param data - 検証するデータ
 * @returns バリデーション結果（成功/エラーメッセージ）
 */
export function validateMessageClientSide(
  data: unknown
):
  | { success: true; data: z.infer<typeof messageSendSchema> }
  | { success: false; errors: Record<string, string> } {
  try {
    // クライアント側では基本的なバリデーションのみ実施
    const result = messageSendSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.') || 'general';
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return { success: false, errors };
    }

    return {
      success: false,
      errors: { general: '入力データの検証に失敗しました' },
    };
  }
}
```

### 環境検出ユーティリティ

```typescript
// src/utils/common/environment.ts

/**
 * 現在の実行環境がサーバーサイドかどうかを判定する
 *
 * @returns サーバーサイドの場合はtrue、クライアントサイドの場合はfalse
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * 現在の実行環境が開発環境かどうかを判定する
 *
 * @returns 開発環境の場合はtrue、本番環境の場合はfalse
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 現在の実行環境がテスト環境かどうかを判定する
 *
 * @returns テスト環境の場合はtrue、それ以外の場合はfalse
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * 環境変数を安全に取得する
 *
 * @param key - 環境変数のキー
 * @param required - 必須かどうか。trueの場合、値が存在しないとエラーをスロー
 * @param defaultValue - デフォルト値（requiredがfalseの場合のみ使用）
 * @returns 環境変数の値
 * @throws Error - required=trueで値が存在しない場合
 */
export function getEnv(key: string, required: boolean = false, defaultValue: string = ''): string {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`必須の環境変数 ${key} が設定されていません`);
  }

  return value || defaultValue;
}
```

## カスタムバリデーションルール

### プロジェクト固有ルール

```typescript
// src/utils/validation/customRules.ts

import { z } from 'zod';

/**
 * カスタムステップバリデーションルール
 * ステップタイプに応じた固有のバリデーションを行う
 *
 * @param stepType - ステップのタイプ
 * @returns 特定のステップタイプに対応したスキーマ
 */
export function getStepContentSchemaByType(stepType: string): z.ZodTypeAny {
  switch (stepType) {
    case 'form':
      return z.object({
        fields: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            type: z.enum(['text', 'number', 'select', 'checkbox', 'textarea']),
            required: z.boolean().optional(),
            options: z
              .array(
                z.object({
                  value: z.string(),
                  label: z.string(),
                })
              )
              .optional(),
          })
        ),
        submitLabel: z.string().optional(),
      });

    case 'ai_prompt':
      return z.object({
        system: z.string().min(1, 'システムプロンプトは必須です'),
        template: z.string().min(1, 'テンプレートは必須です'),
        variables: z.array(z.string()).optional(),
        model: z.string().min(1, 'モデルは必須です'),
        maxTokens: z.number().int().positive().optional(),
      });

    case 'code_execution':
      return z.object({
        language: z.enum(['javascript', 'python', 'bash']),
        code: z.string().min(1, 'コードは必須です'),
        timeout: z.number().int().positive().optional(),
      });

    default:
      // デフォルトは汎用的なスキーマ
      return z.record(z.unknown());
  }
}

/**
 * 日付範囲のバリデーション
 * 開始日と終了日の整合性を検証する
 *
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns 検証エラーがある場合はエラーメッセージ、なければnull
 */
export function validateDateRange(startDate: Date | string, endDate: Date | string): string | null {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (isNaN(start.getTime())) {
    return '開始日が無効です';
  }

  if (isNaN(end.getTime())) {
    return '終了日が無効です';
  }

  if (start > end) {
    return '開始日は終了日より前である必要があります';
  }

  return null;
}

/**
 * プロジェクトとステップの関連検証
 * ステップがプロジェクトに属しているかを検証する
 *
 * @param projectId - プロジェクトID
 * @param stepIds - 検証するステップIDの配列
 * @param availableStepIds - 該当プロジェクトに実際に属するステップIDの配列
 * @returns 検証エラーがある場合はエラーメッセージ、なければnull
 */
export function validateStepsBelongToProject(
  projectId: string,
  stepIds: string[],
  availableStepIds: string[]
): string | null {
  const invalidStepIds = stepIds.filter((id) => !availableStepIds.includes(id));

  if (invalidStepIds.length > 0) {
    return `以下のステップIDはプロジェクト(${projectId})に属していません: ${invalidStepIds.join(', ')}`;
  }

  return null;
}
```

## 日付操作

### 日付計算

```typescript
// src/utils/date/dateCalculations.ts

/**
 * 指定された日数を日付に加算する
 *
 * @param date - 基準となる日付
 * @param days - 加算する日数（負の値も可）
 * @returns 新しい日付オブジェクト
 * @example
 * const tomorrow = addDays(new Date(), 1);
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 指定された月数を日付に加算する
 *
 * @param date - 基準となる日付
 * @param months - 加算する月数（負の値も可）
 * @returns 新しい日付オブジェクト
 * @example
 * const nextMonth = addMonths(new Date(), 1);
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * 2つの日付間の日数差を計算する
 *
 * @param date1 - 1つ目の日付
 * @param date2 - 2つ目の日付
 * @returns 日数差（date1 - date2、小数点以下は切り捨て）
 * @example
 * const daysPassed = daysBetween(new Date('2023-12-31'), new Date('2023-12-24')); // 7
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // 1日のミリ秒数
  const time1 = date1.getTime();
  const time2 = date2.getTime();

  // 日付部分のみを比較するために時刻をリセット
  const utcDate1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utcDate2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  return Math.floor((utcDate1 - utcDate2) / oneDay);
}

/**
 * 指定された日付が2つの日付の間にあるかを検証する
 *
 * @param date - 検証する日付
 * @param startDate - 範囲の開始日
 * @param endDate - 範囲の終了日
 * @param inclusive - 境界値を含めるかどうか（デフォルト: true）
 * @returns 範囲内の場合はtrue、そうでない場合はfalse
 */
export function isDateBetween(
  date: Date,
  startDate: Date,
  endDate: Date,
  inclusive: boolean = true
): boolean {
  const time = date.getTime();

  return inclusive
    ? time >= startDate.getTime() && time <= endDate.getTime()
    : time > startDate.getTime() && time < endDate.getTime();
}

/**
 * 日本の祝日かどうかを判定する
 * 注: 実際の実装では日本の祝日データベースが必要
 *
 * @param date - 検証する日付
 * @returns 祝日の場合はtrue、そうでない場合はfalse
 */
export function isJapaneseHoliday(date: Date): boolean {
  // 実際の実装では日本の祝日データを使用して判定
  // ここではサンプルのため、簡易実装
  return false;
}

/**
 * 営業日（平日）かどうかを判定する
 *
 * @param date - 検証する日付
 * @returns 営業日の場合はtrue、そうでない場合はfalse
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();

  // 土曜日(6)または日曜日(0)は営業日ではない
  if (day === 0 || day === 6) {
    return false;
  }

  // 祝日も営業日ではない
  if (isJapaneseHoliday(date)) {
    return false;
  }

  return true;
}
```

## タイムゾーン処理

### タイムゾーン変換

```typescript
// src/utils/date/timezone.ts

/**
 * UTC日時をターゲットタイムゾーンに変換する
 *
 * @param date - 変換する日付（UTC）
 * @param targetTimezone - ターゲットタイムゾーン（IANA形式、例: 'Asia/Tokyo'）
 * @returns 指定タイムゾーンでフォーマットされた日時文字列
 * @example
 * const tokyoTime = convertToTimezone(new Date(), 'Asia/Tokyo');
 */
export function convertToTimezone(date: Date, targetTimezone: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: targetTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * 現在のブラウザのタイムゾーンを取得する
 * クライアントサイドでのみ動作
 *
 * @returns 現在のタイムゾーン（IANA形式、例: 'Asia/Tokyo'）またはUTC
 */
export function detectBrowserTimezone(): string {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
    return 'UTC';
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('タイムゾーンの検出に失敗しました:', error);
    return 'UTC';
  }
}

/**
 * ISOフォーマットの日時文字列を特定のタイムゾーンに変換する
 *
 * @param isoString - ISO形式の日時文字列
 * @param timezone - タイムゾーン（IANA形式）
 * @returns 変換された日時を含むDateオブジェクト
 */
export function parseISOInTimezone(isoString: string, timezone: string): Date {
  // タイムゾーン情報付きの日時文字列を解析
  const date = new Date(isoString);

  // DateオブジェクトをUTCとしてフォーマット
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    timeZoneName: 'short',
  });

  // タイムゾーン調整済みの文字列を取得して再度Dateに変換
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  // 新しいDateオブジェクトを作成
  return new Date(
    parseInt(values.year),
    parseInt(values.month) - 1,
    parseInt(values.day),
    parseInt(values.hour),
    parseInt(values.minute),
    parseInt(values.second)
  );
}
```

## フォーマット関数

### 標準化されたフォーマット

```typescript
// src/utils/date/formatters.ts

/**
 * 日付を標準的なフォーマットで文字列に変換する
 *
 * @param date - フォーマットする日付
 * @param format - フォーマットタイプ
 * @returns フォーマットされた日付文字列
 * @example
 * // '2023-12-31'
 * const dateStr = formatDate(new Date(2023, 11, 31), 'iso-date');
 */
export function formatDate(
  date: Date,
  format: 'iso-date' | 'iso-datetime' | 'ja-date' | 'ja-datetime' = 'iso-date'
): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }

  switch (format) {
    case 'iso-date':
      // YYYY-MM-DD
      return date.toISOString().split('T')[0];

    case 'iso-datetime':
      // YYYY-MM-DDThh:mm:ss.sssZ
      return date.toISOString();

    case 'ja-date':
      // YYYY年MM月DD日
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;

    case 'ja-datetime':
      // YYYY年MM月DD日 hh:mm
      return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    default:
      return date.toISOString();
  }
}

/**
 * 相対的な時間表現に変換する
 *
 * @param date - 変換する日時
 * @param referenceDate - 基準となる日時（デフォルト: 現在時刻）
 * @returns 相対時間の文字列表現
 * @example
 * // '3日前'
 * const relativeTime = formatRelativeTime(threeDaysAgo);
 */
export function formatRelativeTime(date: Date, referenceDate: Date = new Date()): string {
  const diffInMilliseconds = referenceDate.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 0) {
    // 未来の日時
    return formatDate(date, 'ja-datetime');
  } else if (diffInSeconds < 60) {
    return '今すぐ';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  } else if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  } else if (diffInDays < 7) {
    return `${diffInDays}日前`;
  } else {
    return formatDate(date, 'ja-date');
  }
}

/**
 * 期間（ミリ秒）を人間が読みやすい形式に変換する
 *
 * @param durationMs - ミリ秒単位の期間
 * @param detailed - 詳細表示の有無（デフォルト: false）
 * @returns フォーマットされた期間文字列
 * @example
 * // '2時間30分'
 * const duration = formatDuration(2 * 60 * 60 * 1000 + 30 * 60 * 1000);
 */
export function formatDuration(durationMs: number, detailed: boolean = false): string {
  if (durationMs < 0) {
    return '0秒';
  }

  const seconds = Math.floor(durationMs / 1000) % 60;
  const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
  const hours = Math.floor(durationMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}日`);
  }

  if (hours > 0 || (detailed && days > 0)) {
    parts.push(`${hours}時間`);
  }

  if (minutes > 0 || (detailed && (hours > 0 || days > 0))) {
    parts.push(`${minutes}分`);
  }

  if (seconds > 0 || (detailed && parts.length === 0)) {
    parts.push(`${seconds}秒`);
  }

  return parts.length > 0 ? parts.join(detailed ? ' ' : '') : '0秒';
}
```

## ログレベル・フォーマット

### 構造化ロギング

```typescript
// src/utils/logging/logger.ts
'use server';

import { getEnv, isDevelopment } from '@/utils/common/environment';

/**
 * ログレベルの定義
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * ログエントリの基本構造
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

/**
 * アプリケーションロガー
 * 構造化されたログを生成する
 */
export class AppLogger {
  private currentLogLevel: LogLevel;
  private contextData: Record<string, unknown>;

  /**
   * ロガーを初期化する
   *
   * @param serviceName - サービス名（ログ識別用）
   * @param initialContext - 初期コンテキストデータ
   */
  constructor(
    private readonly serviceName: string,
    initialContext: Record<string, unknown> = {}
  ) {
    // 環境変数からログレベルを取得（デフォルトは開発環境ではDEBUG、本番環境ではINFO）
    const logLevelString = getEnv('LOG_LEVEL', false, isDevelopment() ? 'DEBUG' : 'INFO');
    this.currentLogLevel = this.parseLogLevel(logLevelString);

    // 初期コンテキストを設定
    this.contextData = {
      service: this.serviceName,
      ...initialContext,
    };
  }

  /**
   * エラーレベルのログを出力する
   *
   * @param message - ログメッセージ
   * @param error - エラーオブジェクト（オプション）
   * @param context - 追加コンテキスト（オプション）
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.currentLogLevel >= LogLevel.ERROR) {
      this.log('ERROR', message, {
        ...context,
        ...(error && {
          error: {
            name: error.name,
            message: error.message,
            stack: isDevelopment() ? error.stack : undefined,
          },
        }),
      });
    }
  }

  /**
   * 警告レベルのログを出力する
   *
   * @param message - ログメッセージ
   * @param context - 追加コンテキスト（オプション）
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (this.currentLogLevel >= LogLevel.WARN) {
      this.log('WARN', message, context);
    }
  }

  /**
   * 情報レベルのログを出力する
   *
   * @param message - ログメッセージ
   * @param context - 追加コンテキスト（オプション）
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (this.currentLogLevel >= LogLevel.INFO) {
      this.log('INFO', message, context);
    }
  }

  /**
   * デバッグレベルのログを出力する
   *
   * @param message - ログメッセージ
   * @param context - 追加コンテキスト（オプション）
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.currentLogLevel >= LogLevel.DEBUG) {
      this.log('DEBUG', message, context);
    }
  }

  /**
   * トレースレベルのログを出力する
   *
   * @param message - ログメッセージ
   * @param context - 追加コンテキスト（オプション）
   */
  trace(message: string, context?: Record<string, unknown>): void {
    if (this.currentLogLevel >= LogLevel.TRACE) {
      this.log('TRACE', message, context);
    }
  }

  /**
   * 子ロガーを作成する
   * 親ロガーからコンテキストを継承する
   *
   * @param childName - 子ロガーの名前
   * @param additionalContext - 追加コンテキスト
   * @returns 新しいロガーインスタンス
   */
  createChildLogger(childName: string, additionalContext: Record<string, unknown> = {}): AppLogger {
    const childLogger = new AppLogger(`${this.serviceName}:${childName}`);
    childLogger.currentLogLevel = this.currentLogLevel;
    childLogger.contextData = {
      ...this.contextData,
      ...additionalContext,
    };

    return childLogger;
  }

  /**
   * 相関IDを設定する
   * 複数のログエントリを関連付けるために使用
   *
   * @param correlationId - 相関ID
   */
  setCorrelationId(correlationId: string): void {
    this.contextData.correlationId = correlationId;
  }

  /**
   * ログエントリを作成して出力する
   *
   * @param level - ログレベル文字列
   * @param message - ログメッセージ
   * @param context - 追加コンテキスト
   */
  private log(level: string, message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...this.contextData,
      ...(context && { context }),
    };

    // 本番環境では機密情報をマスキング
    if (!isDevelopment()) {
      this.maskSensitiveData(logEntry);
    }

    // 構造化ログをJSON形式で出力
    console.log(JSON.stringify(logEntry));
  }

  /**
   * 機密情報をマスキングする
   *
   * @param obj - マスキング対象オブジェクト
   */
  private maskSensitiveData(obj: Record<string, any>): void {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.maskSensitiveData(obj[key]);
      } else if (
        typeof obj[key] === 'string' &&
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))
      ) {
        obj[key] = '***masked***';
      }
    }
  }

  /**
   * ログレベル文字列をenumに変換する
   *
   * @param level - ログレベル文字列
   * @returns ログレベルenum
   */
  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'TRACE':
        return LogLevel.TRACE;
      default:
        return LogLevel.INFO;
    }
  }
}

// デフォルトロガーのインスタンスをエクスポート
export const logger = new AppLogger('AiStart');
```

## エラー型定義

### 基底エラークラス

```typescript
// src/utils/errors/AppErrors.ts

/**
 * アプリケーションの基底エラークラス
 * すべてのカスタムエラーの親クラス
 */
export class BaseError extends Error {
  /**
   * エラーコード
   */
  readonly code: string;

  /**
   * HTTP状態コード
   */
  readonly statusCode: number;

  /**
   * エラーの詳細情報
   */
  readonly details?: Record<string, unknown>;

  /**
   * ユーザー向けエラーメッセージ
   * 多言語化対応のためのキーとパラメータ
   */
  readonly userMessage: {
    key: string;
    params?: Record<string, string>;
  };

  /**
   * 基底エラーを初期化する
   *
   * @param message - エラーメッセージ
   * @param code - エラーコード（デフォルト：'INTERNAL_ERROR'）
   * @param statusCode - HTTP状態コード（デフォルト：500）
   * @param details - 詳細情報
   */
  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.userMessage = {
      key: `errors.${code.toLowerCase()}`,
      params: details
        ? Object.entries(details).reduce(
            (acc, [key, value]) => {
              if (typeof value === 'string') {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, string>
          )
        : undefined,
    };

    // Error継承時のプロトタイプチェーン修正（TypeScriptのためのハック）
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * エラーをJSON形式に変換する
   *
   * @returns JSONシリアライズ可能なオブジェクト
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
      userMessage: this.userMessage,
    };
  }
}

/**
 * バリデーションエラー
 * 入力データが無効な場合に使用
 */
export class ValidationError extends BaseError {
  /**
   * バリデーションエラーを初期化する
   *
   * @param message - エラーメッセージ
   * @param validationErrors - バリデーションエラーの詳細
   */
  constructor(message: string, validationErrors: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, { validationErrors });
  }
}

/**
 * 認証エラー
 * ユーザーが認証されていない場合に使用
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = '認証に失敗しました') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * 認可エラー
 * ユーザーに必要な権限がない場合に使用
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = '操作を実行する権限がありません') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * リソース未検出エラー
 * 要求されたリソースが存在しない場合に使用
 */
export class NotFoundError extends BaseError {
  /**
   * リソース未検出エラーを初期化する
   *
   * @param resourceType - リソースの種類（例：'user', 'project'）
   * @param resourceId - リソースのID
   */
  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} with id ${resourceId} not found`, 'RESOURCE_NOT_FOUND', 404, {
      resourceType,
      resourceId,
    });
  }
}

/**
 * 外部サービスエラー
 * 外部APIやサービスとの通信に問題がある場合に使用
 */
export class ExternalServiceError extends BaseError {
  /**
   * 外部サービスエラーを初期化する
   *
   * @param serviceName - サービス名
   * @param message - エラーメッセージ
   * @param originalError - 元のエラー
   */
  constructor(
    serviceName: string,
    message: string = `${serviceName}との通信中にエラーが発生しました`,
    originalError?: Error
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, {
      serviceName,
      originalMessage: originalError?.message,
      originalStack: originalError?.stack,
    });
  }
}
```

## エラーハンドリング方針

### エラー変換

```typescript
// src/utils/errors/errorHandlers.ts

import { z } from 'zod';
import { BaseError, ExternalServiceError, ValidationError } from './AppErrors';

/**
 * APIエラーレスポンスの型
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    userMessage?: {
      key: string;
      params?: Record<string, string>;
    };
  };
}

/**
 * エラーをAPIエラーレスポンスに変換する
 *
 * @param error - 変換するエラー
 * @returns API形式のエラーレスポンス
 */
export function convertErrorToApiResponse(error: unknown): ApiErrorResponse {
  if (error instanceof BaseError) {
    // カスタムエラーはそのままAPIレスポンス形式に変換
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        userMessage: error.userMessage,
      },
    };
  } else if (error instanceof z.ZodError) {
    // Zodエラーをバリデーションエラーに変換
    const validationError = new ValidationError(
      'バリデーションエラーが発生しました',
      formatZodErrors(error)
    );

    return convertErrorToApiResponse(validationError);
  } else if (error instanceof Error) {
    // 一般的なエラーはBaseErrorにラップ
    const baseError = new BaseError(
      error.message || '不明なエラーが発生しました',
      'UNKNOWN_ERROR',
      500,
      { originalError: error.name, stack: error.stack }
    );

    return convertErrorToApiResponse(baseError);
  } else {
    // エラーオブジェクトでない場合は汎用エラー
    const baseError = new BaseError('不明なエラーが発生しました', 'UNKNOWN_ERROR', 500, {
      originalError: String(error),
    });

    return convertErrorToApiResponse(baseError);
  }
}

/**
 * Zodエラーをフィールド名をキーとするエラーメッセージマップに変換する
 *
 * @param error - Zodエラー
 * @returns フィールド名をキーとするエラーメッセージマップ
 */
function formatZodErrors(error: z.ZodError): Record<string, string> {
  return error.errors.reduce(
    (acc, err) => {
      const path = err.path.join('.') || 'general';
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * 外部APIのエラーレスポンスをアプリケーションエラーに変換する
 *
 * @param response - 外部APIのレスポンス
 * @param serviceName - 外部サービス名
 * @returns 変換されたアプリケーションエラー
 */
export async function handleExternalApiError(
  response: Response,
  serviceName: string
): Promise<BaseError> {
  let errorData;

  try {
    errorData = await response.json();
  } catch (e) {
    // JSON解析エラー
    return new ExternalServiceError(
      serviceName,
      `${serviceName}からの応答を解析できませんでした (${response.status})`,
      e instanceof Error ? e : new Error(String(e))
    );
  }

  // エラーデータに基づいて適切なエラーを生成
  return new ExternalServiceError(
    serviceName,
    errorData.message || `${serviceName}からエラーレスポンスを受信しました (${response.status})`,
    new Error(JSON.stringify(errorData))
  );
}

/**
 * AI APIエラーを処理する特殊ハンドラー
 * AIサービス固有のエラーパターンを処理する
 *
 * @param error - エラーオブジェクト
 * @param modelName - AIモデル名
 * @returns 処理済みのエラー
 */
export function handleAiApiError(error: unknown, modelName: string): BaseError {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // レート制限エラー
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return new ExternalServiceError(
        'AI API',
        `AIサービスのレート制限に達しました (${modelName})`,
        error
      );
    }

    // コンテキスト長超過エラー
    if (errorMessage.includes('maximum context length') || errorMessage.includes('token limit')) {
      return new ExternalServiceError('AI API', `コンテキストが長すぎます (${modelName})`, error);
    }

    // モデル利用不可エラー
    if (errorMessage.includes('model not found') || errorMessage.includes('model unavailable')) {
      return new ExternalServiceError(
        'AI API',
        `指定されたAIモデル (${modelName}) は現在利用できません`,
        error
      );
    }
  }

  // その他のエラー
  return new ExternalServiceError(
    'AI API',
    `AIサービスとの通信中にエラーが発生しました (${modelName})`,
    error instanceof Error ? error : new Error(String(error))
  );
}
```

### リトライロジック

```typescript
// src/utils/errors/retryLogic.ts

import { logger } from '@/utils/logging/logger';

/**
 * リトライ設定オプション
 */
interface RetryOptions {
  /**
   * 最大リトライ回数
   */
  maxRetries: number;

  /**
   * 初期遅延時間（ミリ秒）
   */
  initialDelayMs: number;

  /**
   * 遅延倍率（バックオフ係数）
   */
  delayFactor: number;

  /**
   * リトライ対象のエラーを判定する関数
   */
  isRetryable?: (error: unknown) => boolean;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: unknown, attempt: number) => void;
}

/**
 * 指数バックオフ付きのリトライロジックを実装する
 *
 * @param operation - リトライする非同期操作
 * @param options - リトライオプション
 * @returns 操作の結果
 * @throws 最大リトライ回数を超えた場合、最後のエラーをスロー
 * @example
 * const result = await withRetry(
 *   () => fetchDataFromApi(),
 *   { maxRetries: 3, initialDelayMs: 500, delayFactor: 2 }
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  // デフォルトオプションとマージ
  const config: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 500,
    delayFactor: 2,
    isRetryable: () => true,
    onError: (error, attempt) => {
      logger.warn(`操作に失敗しました（リトライ ${attempt}/${config.maxRetries}）`, {
        error: error instanceof Error ? error.message : String(error),
        attempt,
        maxRetries: config.maxRetries,
      });
    },
    ...options,
  };

  let lastError: unknown;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // 最後の試行だった場合、またはリトライ不可のエラーの場合はエラーをスロー
      if (attempt > config.maxRetries || (config.isRetryable && !config.isRetryable(error))) {
        throw error;
      }

      // エラーコールバックを実行
      if (config.onError) {
        config.onError(error, attempt);
      }

      // 遅延を実装
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // 次回の遅延を計算（指数バックオフ）
      delayMs *= config.delayFactor;
    }
  }

  // ここには到達しないはずだが、型安全のため
  throw lastError;
}

/**
 * ネットワークエラーがリトライ可能かを判定する
 *
 * @param error - 評価するエラー
 * @returns リトライ可能な場合はtrue
 */
export function isNetworkErrorRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();

  // 一時的なネットワークエラー
  const temporaryNetworkErrors = [
    'etimedout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'network error',
    'network request failed',
    'failed to fetch',
    '5', // 5xxエラーの簡易チェック
    'timeout',
    'request timed out',
  ];

  return temporaryNetworkErrors.some((term) => errorMessage.includes(term));
}

/**
 * AIサービスのエラーがリトライ可能かを判定する
 *
 * @param error - 評価するエラー
 * @returns リトライ可能な場合はtrue
 */
export function isAiServiceErrorRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorMessage = error.message.toLowerCase();

  // リトライ可能なAIサービスエラー
  const retryableAiErrors = [
    'rate limit',
    'too many requests',
    'server overloaded',
    'service unavailable',
    'timeout',
    'internal server error',
    'bad gateway',
    'gateway timeout',
  ];

  // リトライ不可能なAIサービスエラー
  const nonRetryableAiErrors = [
    'authentication',
    'unauthorized',
    'invalid api key',
    'permission denied',
    'content policy violation',
    'invalid input',
    'not found',
    'unsupported model',
  ];

  // 非リトライ可能なエラーが含まれる場合はfalse
  if (nonRetryableAiErrors.some((term) => errorMessage.includes(term))) {
    return false;
  }

  // リトライ可能なエラーまたは一般的なネットワークエラーの場合はtrue
  return (
    retryableAiErrors.some((term) => errorMessage.includes(term)) || isNetworkErrorRetryable(error)
  );
}
```

## 暗号化・復号化

### データ暗号化

```typescript
// src/utils/security/encryption.ts
'use server';

import crypto from 'crypto';
import { getEnv } from '@/utils/common/environment';

/**
 * 暗号化の設定
 */
const ENCRYPTION_CONFIG = {
  /**
   * 使用するアルゴリズム
   */
  algorithm: 'aes-256-gcm',

  /**
   * キー取得関数
   */
  getKey: (): Buffer => {
    const key = getEnv('ENCRYPTION_KEY', true);
    return crypto.scryptSync(key, 'salt', 32); // 256ビットキー
  },

  /**
   * 初期化ベクトル（IV）の長さ
   */
  ivLength: 16,

  /**
   * 認証タグの長さ
   */
  authTagLength: 16,
};

/**
 * 暗号化されたデータの構造
 */
interface EncryptedData {
  /**
   * 初期化ベクトル（IV）
   */
  iv: string;

  /**
   * 暗号文
   */
  encryptedData: string;

  /**
   * 認証タグ
   */
  authTag: string;
}

/**
 * データを暗号化する
 *
 * @param data - 暗号化する平文データ
 * @returns 暗号化されたデータ（IV、暗号文、認証タグを含む）
 * @throws Error - 暗号化に失敗した場合
 * @example
 * const sensitive = 'secret-api-key-12345';
 * const encrypted = encryptData(sensitive);
 * // データベースに encrypted を保存
 */
export function encryptData(data: string): string {
  try {
    // ランダムなIVを生成
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

    // 暗号化器を作成
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      ENCRYPTION_CONFIG.getKey(),
      iv
    );

    // データを暗号化
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    // 認証タグを取得
    const authTag = cipher.getAuthTag();

    // 結果をJSONとして返す
    const result: EncryptedData = {
      iv: iv.toString('hex'),
      encryptedData,
      authTag: authTag.toString('hex'),
    };

    return JSON.stringify(result);
  } catch (error) {
    throw new Error(
      `データの暗号化に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * 暗号化されたデータを復号する
 *
 * @param encryptedString - 暗号化されたデータの文字列表現
 * @returns 復号された平文
 * @throws Error - 復号に失敗した場合
 * @example
 * // データベースから encrypted を取得
 * const decrypted = decryptData(encrypted);
 * // decrypted === 'secret-api-key-12345'
 */
export function decryptData(encryptedString: string): string {
  try {
    // JSON文字列をパース
    const { iv, encryptedData, authTag } = JSON.parse(encryptedString) as EncryptedData;

    // 復号器を作成
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      ENCRYPTION_CONFIG.getKey(),
      Buffer.from(iv, 'hex')
    );

    // 認証タグを設定
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    // データを復号
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      `データの復号に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * ファイルのハッシュ値を計算する
 *
 * @param data - ハッシュを計算するデータ
 * @param algorithm - 使用するハッシュアルゴリズム（デフォルト: 'sha256'）
 * @returns ハッシュ値（16進数文字列）
 * @example
 * const fileHash = calculateHash(fileBuffer);
 * // ファイルの整合性検証に使用
 */
export function calculateHash(data: Buffer | string, algorithm: string = 'sha256'): string {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
}

/**
 * タイミング攻撃に耐性のある文字列比較を行う
 *
 * @param a - 比較する文字列1
 * @param b - 比較する文字列2
 * @returns 文字列が等しい場合はtrue
 * @example
 * // トークンやハッシュの安全な比較
 * if (safeCompare(userProvidedToken, storedToken)) {
 *   // 認証成功
 * }
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch (error) {
    // 長さが異なる場合などに例外が発生するが、
    // 単にfalseを返して長さの違いを漏らさない
    return false;
  }
}
```

## パスワード処理

### パスワードハッシュ

```typescript
// src/utils/security/password.ts
'use server';

import argon2 from 'argon2';
import { getEnv, isDevelopment } from '@/utils/common/environment';
import { logger } from '@/utils/logging/logger';

/**
 * Argon2ハッシュの設定
 */
const ARGON2_CONFIG = {
  // コスト係数（メモリ使用量）
  memoryCost: parseInt(getEnv('ARGON2_MEMORY_COST', false, '65536')),

  // 並列度
  parallelism: parseInt(getEnv('ARGON2_PARALLELISM', false, '4')),

  // イテレーション回数
  timeCost: parseInt(getEnv('ARGON2_TIME_COST', false, '3')),

  // ハッシュタイプ（password = Argon2id）
  type: argon2.argon2id,

  // ハッシュ長（バイト）
  hashLength: 32,

  // ソルト長（バイト）
  saltLength: 16,
};

/**
 * パスワードをハッシュ化する
 *
 * @param password - ハッシュ化する平文パスワード
 * @returns ハッシュ化されたパスワード
 * @throws Error - ハッシュ化に失敗した場合
 * @example
 * const hashedPassword = await hashPassword('user-password-123');
 * // データベースに hashedPassword を保存
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      ...ARGON2_CONFIG,
      // 開発環境では低速な設定を避ける
      ...(isDevelopment() && {
        memoryCost: 4096,
        timeCost: 2,
      }),
    });
  } catch (error) {
    logger.error(
      'パスワードのハッシュ化に失敗しました',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error('パスワードの処理中にエラーが発生しました');
  }
}

/**
 * パスワードが正しいかを検証する
 *
 * @param password - 検証する平文パスワード
 * @param hashedPassword - 保存されているハッシュパスワード
 * @returns パスワードが一致する場合はtrue
 * @example
 * const isValid = await verifyPassword(userInputPassword, userFromDb.hashedPassword);
 * if (isValid) {
 *   // 認証成功
 * }
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch (error) {
    logger.error(
      'パスワード検証に失敗しました',
      error instanceof Error ? error : new Error(String(error))
    );
    return false;
  }
}

/**
 * パスワードの強度を評価する
 *
 * @param password - 評価するパスワード
 * @returns 強度評価（weak, medium, strong, very-strong）と理由
 * @example
 * const { strength, reasons } = evaluatePasswordStrength(userPassword);
 * if (strength === 'weak') {
 *   // ユーザーに改善を促す
 * }
 */
export function evaluatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  reasons: string[];
} {
  const reasons: string[] = [];

  // 基本チェック
  if (!password || password.length < 8) {
    reasons.push('パスワードは8文字以上である必要があります');
    return { strength: 'weak', reasons };
  }

  // 複雑さの評価
  let score = 0;

  // 長さボーナス
  if (password.length >= 12) {
    score += 1;
  }
  if (password.length >= 16) {
    score += 1;
  }

  // 文字種類のチェック
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    reasons.push('大文字を含めることで強度が向上します');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    reasons.push('小文字を含めることで強度が向上します');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    reasons.push('数字を含めることで強度が向上します');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  } else {
    reasons.push('特殊文字を含めることで強度が向上します');
  }

  // 共通パターンチェック
  const commonPatterns = [
    'password',
    'qwerty',
    '123456',
    'admin',
    'welcome',
    'letmein',
    'monkey',
    'dragon',
    'baseball',
    'football',
    'superman',
    'batman',
    'trustno1',
  ];

  if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
    score -= 2;
    reasons.push('よく使われるパターンが含まれています');
  }

  // 強度評価
  if (score <= 2) {
    return { strength: 'weak', reasons };
  } else if (score <= 4) {
    return { strength: 'medium', reasons };
  } else if (score <= 6) {
    return { strength: 'strong', reasons };
  } else {
    return { strength: 'very-strong', reasons };
  }
}

/**
 * 安全なパスワードリセットトークンを生成する
 *
 * @returns ランダムなトークン（16進数文字列）
 * @example
 * const resetToken = generatePasswordResetToken();
 * // データベースにユーザーID、トークン、有効期限を保存
 */
export function generatePasswordResetToken(): string {
  const tokenBytes = 32; // 256ビット
  return require('crypto').randomBytes(tokenBytes).toString('hex');
}
```

## トークン生成・検証

### JWT関連

```typescript
// src/utils/security/jwt.ts
'use server';

import jwt from 'jsonwebtoken';
import { getEnv } from '@/utils/common/environment';
import { logger } from '@/utils/logging/logger';
import { UserRole } from '@/types/domain/User';

/**
 * JWTペイロードの基本構造
 */
interface JwtPayload {
  /**
   * サブジェクト（通常はユーザーID）
   */
  sub: string;

  /**
   * ユーザーロール
   */
  role: UserRole;

  /**
   * 発行者
   */
  iss: string;

  /**
   * 発行時刻（UNIXタイムスタンプ）
   */
  iat: number;

  /**
   * 有効期限（UNIXタイムスタンプ）
   */
  exp: number;

  /**
   * トークンID（一意）
   */
  jti: string;

  /**
   * 追加のカスタムクレーム
   */
  [key: string]: unknown;
}

/**
 * JWTトークンを生成する
 *
 * @param userId - ユーザーID
 * @param role - ユーザーロール
 * @param expiresIn - 有効期間（秒）
 * @param additionalClaims - 追加のクレーム
 * @returns 署名付きJWTトークン
 * @throws Error - トークン生成に失敗した場合
 * @example
 * const token = generateJwtToken(user.id, user.role, 3600);
 */
export function generateJwtToken(
  userId: string,
  role: UserRole,
  expiresIn: number = 3600,
  additionalClaims: Record<string, unknown> = {}
): string {
  try {
    const now = Math.floor(Date.now() / 1000);

    const payload: JwtPayload = {
      sub: userId,
      role,
      iss: getEnv('JWT_ISSUER', false, 'aistart-api'),
      iat: now,
      exp: now + expiresIn,
      jti: require('crypto').randomBytes(16).toString('hex'),
      ...additionalClaims,
    };

    return jwt.sign(payload, getEnv('JWT_SECRET', true), {
      algorithm: 'HS256',
    });
  } catch (error) {
    logger.error(
      'JWTトークン生成に失敗しました',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error('認証トークンの生成に失敗しました');
  }
}

/**
 * JWTトークンを検証して解析する
 *
 * @param token - 検証するJWTトークン
 * @returns 検証済みのペイロード
 * @throws Error - トークンが無効または有効期限切れの場合
 * @example
 * try {
 *   const payload = verifyJwtToken(token);
 *   // 認証済みのリクエスト処理
 * } catch (error) {
 *   // 認証エラー処理
 * }
 */
export function verifyJwtToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, getEnv('JWT_SECRET', true), {
      algorithms: ['HS256'],
    });

    return payload as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('認証トークンの有効期限が切れています');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('無効な認証トークンです');
    } else {
      logger.error(
        'JWTトークン検証に失敗しました',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('認証トークンの検証に失敗しました');
    }
  }
}

/**
 * アクセストークンとリフレッシュトークンのペアを生成する
 *
 * @param userId - ユーザーID
 * @param role - ユーザーロール
 * @returns アクセストークンとリフレッシュトークンのペア
 * @example
 * const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
 * // レスポンスとしてアクセストークンを返し、リフレッシュトークンを保存
 */
export function generateTokenPair(
  userId: string,
  role: UserRole
): {
  accessToken: string;
  refreshToken: string;
} {
  // アクセストークン（短命）
  const accessToken = generateJwtToken(
    userId,
    role,
    60 * 60 // 1時間
  );

  // リフレッシュトークン（長命）
  const refreshToken = generateJwtToken(
    userId,
    role,
    60 * 60 * 24 * 30, // 30日
    { tokenType: 'refresh' }
  );

  return { accessToken, refreshToken };
}

/**
 * リフレッシュトークンを使用して新しいアクセストークンを生成する
 *
 * @param refreshToken - リフレッシュトークン
 * @returns 新しいアクセストークン
 * @throws Error - リフレッシュトークンが無効な場合
 * @example
 * try {
 *   const newAccessToken = refreshAccessToken(refreshToken);
 *   // 新しいアクセストークンをクライアントに返す
 * } catch (error) {
 *   // エラー処理
 * }
 */
export function refreshAccessToken(refreshToken: string): string {
  try {
    const payload = verifyJwtToken(refreshToken);

    // リフレッシュトークンであることを確認
    if (payload.tokenType !== 'refresh') {
      throw new Error('無効なリフレッシュトークンです');
    }

    // 新しいアクセストークンを生成
    return generateJwtToken(
      payload.sub,
      payload.role as UserRole,
      60 * 60 // 1時間
    );
  } catch (error) {
    logger.error(
      'アクセストークンのリフレッシュに失敗しました',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error('アクセストークンのリフレッシュに失敗しました');
  }
}
```

## テストデータ生成

### ファクトリ関数

```typescript
// src/utils/testing/factories.ts

import { User, UserRole } from '@/types/domain/User';
import { Project, Step, StepStatus, StepType } from '@/types/domain/Project';
import { v4 as uuidv4 } from 'uuid';

/**
 * ユーザーオブジェクトを生成するファクトリ関数
 *
 * @param overrides - デフォルト値を上書きするプロパティ
 * @returns ユーザーオブジェクト
 * @example
 * const testUser = createUser({ role: 'admin' });
 */
export function createUser(overrides: Partial<User> = {}): User {
  const defaultUser: User = {
    id: uuidv4(),
    email: `user-${Math.floor(Math.random() * 10000)}@example.com`,
    displayName: `Test User ${Math.floor(Math.random() * 100)}`,
    role: 'user' as UserRole,
    preferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...defaultUser, ...overrides };
}

/**
 * プロジェクトオブジェクトを生成するファクトリ関数
 *
 * @param overrides - デフォルト値を上書きするプロパティ
 * @returns プロジェクトオブジェクト
 * @example
 * const testProject = createProject({ ownerId: testUser.id });
 */
export function createProject(overrides: Partial<Project> = {}): Project {
  const id = overrides.id || uuidv4();

  const defaultProject: Project = {
    id,
    name: `Test Project ${Math.floor(Math.random() * 100)}`,
    description: 'This is a test project description',
    ownerId: uuidv4(),
    status: 'active',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [],
  };

  // stepsがある場合はそのまま使用し、ない場合はデフォルト値を設定
  const steps = overrides.steps || [];

  return { ...defaultProject, ...overrides, steps };
}

/**
 * ステップオブジェクトを生成するファクトリ関数
 *
 * @param projectId - ステップが属するプロジェクトID
 * @param overrides - デフォルト値を上書きするプロパティ
 * @returns ステップオブジェクト
 * @example
 * const testStep = createStep(projectId, { type: 'form' });
 */
export function createStep(projectId: string = uuidv4(), overrides: Partial<Step> = {}): Step {
  const stepTypes: StepType[] = ['form', 'ai_prompt', 'code_execution', 'file_upload'];
  const randomType = stepTypes[Math.floor(Math.random() * stepTypes.length)];

  const defaultStep: Step = {
    id: uuidv4(),
    projectId,
    title: `Test Step ${Math.floor(Math.random() * 100)}`,
    description: 'This is a test step description',
    order: overrides.order !== undefined ? overrides.order : 0,
    type: randomType,
    status: 'not_started' as StepStatus,
    content: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { ...defaultStep, ...overrides };
}

/**
 * 複数のステップを持つプロジェクトを生成する
 *
 * @param stepCount - 生成するステップ数
 * @param projectOverrides - プロジェクトのデフォルト値上書き
 * @param stepOverrides - ステップのデフォルト値上書き
 * @returns プロジェクトとステップ
 * @example
 * const { project, steps } = createProjectWithSteps(3);
 */
export function createProjectWithSteps(
  stepCount: number = 3,
  projectOverrides: Partial<Project> = {},
  stepOverrides: Partial<Step> = {}
): { project: Project; steps: Step[] } {
  const project = createProject(projectOverrides);
  const steps: Step[] = [];

  for (let i = 0; i < stepCount; i++) {
    steps.push(
      createStep(project.id, {
        order: i,
        ...stepOverrides,
      })
    );
  }

  project.steps = steps;

  return { project, steps };
}

/**
 * プロジェクト用のモックデータセットを作成する
 * 複数のユーザーとプロジェクトを含む
 *
 * @param userCount - ユーザー数
 * @param projectsPerUser - ユーザーあたりのプロジェクト数
 * @param maxStepsPerProject - プロジェクトあたりの最大ステップ数
 * @returns ユーザー、プロジェクト、ステップのコレクション
 */
export function createTestDataset(
  userCount: number = 3,
  projectsPerUser: number = 2,
  maxStepsPerProject: number = 5
): {
  users: User[];
  projects: Project[];
  steps: Step[];
} {
  const users: User[] = [];
  const projects: Project[] = [];
  let steps: Step[] = [];

  // 管理者ユーザーを作成
  users.push(createUser({ role: 'admin' }));

  // 一般ユーザーを作成
  for (let i = 1; i < userCount; i++) {
    users.push(createUser());
  }

  // ユーザーごとにプロジェクトを作成
  for (const user of users) {
    for (let i = 0; i < projectsPerUser; i++) {
      const stepCount = Math.floor(Math.random() * maxStepsPerProject) + 1;
      const { project, steps: projectSteps } = createProjectWithSteps(stepCount, {
        ownerId: user.id,
      });

      projects.push(project);
      steps = [...steps, ...projectSteps];
    }
  }

  return { users, projects, steps };
}
```

### モックデータ

```typescript
// src/utils/testing/mocks.ts

import { vi } from 'vitest';
import type { User } from '@/types/domain/User';
import type { Project } from '@/types/domain/Project';
import type { Message } from '@/types/domain/Message';

/**
 * APIレスポンスをモックするヘルパー関数
 *
 * @param status - HTTPステータスコード
 * @param data - レスポンスデータ
 * @param headers - レスポンスヘッダー
 * @returns モックResponseオブジェクト
 * @example
 * const mockResponse = mockApiResponse(200, { success: true });
 */
export function mockApiResponse<T>(
  status: number = 200,
  data: T,
  headers: Record<string, string> = {}
): Response {
  const responseInit: ResponseInit = {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  return new Response(JSON.stringify(data), responseInit);
}

/**
 * APIエラーレスポンスをモックするヘルパー関数
 *
 * @param status - HTTPステータスコード
 * @param errorCode - エラーコード
 * @param message - エラーメッセージ
 * @returns モックエラーResponseオブジェクト
 * @example
 * const errorResponse = mockApiErrorResponse(404, 'RESOURCE_NOT_FOUND', 'Project not found');
 */
export function mockApiErrorResponse(
  status: number = 400,
  errorCode: string = 'BAD_REQUEST',
  message: string = 'Bad request'
): Response {
  return mockApiResponse(status, {
    error: {
      code: errorCode,
      message,
      userMessage: {
        key: `errors.${errorCode.toLowerCase()}`,
        params: {},
      },
    },
  });
}

/**
 * 認証済みユーザーをモックする
 *
 * @param user - モックするユーザー情報
 * @returns モック関数のセットアップとクリーンアップ
 * @example
 * const { cleanup } = mockAuthenticatedUser({ id: '123', role: 'admin' });
 * // テスト実行
 * cleanup();
 */
export function mockAuthenticatedUser(user: Partial<User> = {}): {
  cleanup: () => void;
} {
  // モックユーザー
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user',
    ...user,
  };

  // auth.tsのgetCurrentUserをモック
  const originalModule = vi.importActual('@/utils/auth');

  const getCurrentUserMock = vi.fn().mockResolvedValue(mockUser);
  const isAuthenticatedMock = vi.fn().mockResolvedValue(true);

  vi.mock('@/utils/auth', () => ({
    ...(originalModule as object),
    getCurrentUser: getCurrentUserMock,
    isAuthenticated: isAuthenticatedMock,
  }));

  return {
    cleanup: () => {
      vi.clearAllMocks();
      vi.resetModules();
    },
  };
}

/**
 * データベースクエリ結果をモックする
 *
 * @param entity - エンティティ名（例: 'users', 'projects'）
 * @param method - モックするメソッド
 * @param result - モック結果
 * @returns モックのクリーンアップ関数
 * @example
 * const cleanup = mockDbQuery('projects', 'findMany', [project1, project2]);
 * // テスト実行
 * cleanup();
 */
export function mockDbQuery<T>(
  entity: string,
  method: 'findFirst' | 'findMany' | 'count',
  result: T
): () => void {
  const dbModule = vi.importActual('@/lib/db');

  const queryMock = {
    [entity]: {
      [method]: vi.fn().mockResolvedValue(result),
    },
  };

  vi.mock('@/lib/db', () => ({
    ...(dbModule as object),
    db: {
      query: queryMock,
    },
  }));

  return () => {
    vi.clearAllMocks();
    vi.resetModules();
  };
}

/**
 * AIサービスレスポンスをモックする
 *
 * @param responseContent - AIの応答内容
 * @param options - オプション設定
 * @returns モックのクリーンアップ関数
 * @example
 * const cleanup = mockAiResponse('Generated text response');
 * // AIサービスを使用するコードのテスト
 * cleanup();
 */
export function mockAiResponse(
  responseContent: string,
  options: {
    streamMode?: boolean;
    delay?: number;
    error?: Error;
  } = {}
): () => void {
  const aiModule = vi.importActual('@/lib/ai');

  const aiServiceMock = {
    generateCompletion: vi.fn().mockImplementation(async () => {
      if (options.error) {
        throw options.error;
      }

      if (options.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }

      return responseContent;
    }),
    generateCompletionStream: vi.fn().mockImplementation(async function* () {
      if (options.error) {
        throw options.error;
      }

      if (options.streamMode) {
        const chunks = responseContent.split(' ');
        for (const chunk of chunks) {
          if (options.delay) {
            await new Promise((resolve) => setTimeout(resolve, options.delay / chunks.length));
          }
          yield chunk + ' ';
        }
      } else {
        if (options.delay) {
          await new Promise((resolve) => setTimeout(resolve, options.delay));
        }
        yield responseContent;
      }
    }),
  };

  vi.mock('@/lib/ai', () => ({
    ...(aiModule as object),
    aiService: aiServiceMock,
  }));

  return () => {
    vi.clearAllMocks();
    vi.resetModules();
  };
}
```

## テスト用ユーティリティ

### アサーション拡張

```typescript
// src/utils/testing/assertions.ts

import { expect } from 'vitest';

/**
 * オブジェクトが特定のプロパティと値を含むことを検証する
 *
 * @param actual - 検証対象オブジェクト
 * @param expected - 期待するプロパティと値
 * @example
 * expectToContainValues(responseBody, {
 *   id: project.id,
 *   name: project.name
 * });
 */
export function expectToContainValues<T extends Record<string, any>>(
  actual: T,
  expected: Partial<T>
): void {
  for (const [key, value] of Object.entries(expected)) {
    expect(actual).toHaveProperty(key);
    expect(actual[key]).toEqual(value);
  }
}

/**
 * オブジェクト配列が特定の条件を満たすアイテムを含むことを検証する
 *
 * @param array - 検証対象の配列
 * @param predicate - 条件関数
 * @param expectedCount - 期待する一致数（デフォルト: 少なくとも1つ）
 * @example
 * expectArrayToContain(
 *   projects,
 *   project => project.ownerId === userId,
 *   2
 * );
 */
export function expectArrayToContain<T>(
  array: T[],
  predicate: (item: T) => boolean,
  expectedCount?: number
): void {
  const matchingItems = array.filter(predicate);

  if (expectedCount !== undefined) {
    expect(matchingItems).toHaveLength(expectedCount);
  } else {
    expect(matchingItems.length).toBeGreaterThan(0);
  }
}

/**
 * 日付文字列が有効な形式であることを検証する
 *
 * @param dateString - 検証する日付文字列
 * @param format - 検証する形式（'iso' | 'iso-date' | 'timestamp'）
 * @example
 * expectValidDateString(project.createdAt, 'iso');
 */
export function expectValidDateString(
  dateString: string,
  format: 'iso' | 'iso-date' | 'timestamp' = 'iso'
): void {
  switch (format) {
    case 'iso':
      // ISO 8601形式（2023-01-01T12:00:00.000Z）
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
      break;

    case 'iso-date':
      // ISO日付形式（2023-01-01）
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      break;

    case 'timestamp':
      // UNIXタイムスタンプ（数値文字列）
      expect(dateString).toMatch(/^\d+$/);
      break;
  }

  // 実際にDateオブジェクトに変換できることを確認
  const date = new Date(dateString);
  expect(date.toString()).not.toBe('Invalid Date');
}

/**
 * プロジェクトオブジェクトが有効な構造を持つことを検証する
 *
 * @param project - 検証するプロジェクトオブジェクト
 * @example
 * expectValidProject(responseBody.project);
 */
export function expectValidProject(project: any): void {
  expect(project).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    ownerId: expect.any(String),
    status: expect.stringMatching(/^(active|archived|completed)$/),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });

  // 日付の検証
  expectValidDateString(project.createdAt);
  expectValidDateString(project.updatedAt);

  // ステップの配列がある場合は各ステップを検証
  if (project.steps) {
    expect(Array.isArray(project.steps)).toBe(true);

    project.steps.forEach((step: any) => {
      expect(step).toMatchObject({
        id: expect.any(String),
        projectId: project.id,
        title: expect.any(String),
        order: expect.any(Number),
      });
    });
  }
}

/**
 * 非同期関数が特定の時間内に完了することを検証する
 *
 * @param asyncFn - 検証する非同期関数
 * @param maxTime - 最大許容時間（ミリ秒）
 * @returns asyncFnの戻り値
 * @example
 * const result = await expectTimeUnder(
 *   () => performDatabaseQuery(),
 *   100
 * );
 */
export async function expectTimeUnder<T>(asyncFn: () => Promise<T>, maxTime: number): Promise<T> {
  const startTime = performance.now();
  const result = await asyncFn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  expect(duration).toBeLessThan(maxTime);
  return result;
}
```

### テスト環境設定

```typescript
// src/utils/testing/setup.ts

import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * テスト用のデータベースを初期化する
 * テストごとにユニークなスキーマを使用して分離を確保
 *
 * @returns クリーンアップ関数
 * @example
 * const cleanupDb = await setupTestDatabase();
 * // テスト実行
 * await cleanupDb();
 */
export async function setupTestDatabase(): Promise<() => Promise<void>> {
  // テスト分離のためのユニークなスキーマ名
  const schemaId = uuidv4().replace(/-/g, '');
  const schemaName = `test_${schemaId}`;

  // 新しいスキーマを作成
  await db.execute(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // スキーマ内にテーブルを作成
  await db.execute(`SET search_path TO "${schemaName}"`);

  // マイグレーションを実行
  await db.execute(`
    -- ユーザーテーブル
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      hashed_password TEXT,
      role TEXT NOT NULL,
      preferences JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- プロジェクトテーブル
    CREATE TABLE projects (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id UUID NOT NULL REFERENCES users(id),
      status TEXT NOT NULL,
      settings JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    -- ステップテーブル
    CREATE TABLE steps (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id),
      title TEXT NOT NULL,
      description TEXT,
      order INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      content JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // クリーンアップ関数
  return async () => {
    // テスト後にスキーマを削除
    await db.execute(`DROP SCHEMA "${schemaName}" CASCADE`);
  };
}

/**
 * テスト用のモックストレージを初期化する
 *
 * @returns モックストレージと関連メソッド
 * @example
 * const storage = setupTestStorage();
 * // ファイルアップロードテスト
 * await storage.delete('test.jpg');
 */
export function setupTestStorage(): {
  files: Map<string, Buffer>;
  upload: (path: string, data: Buffer) => Promise<string>;
  download: (path: string) => Promise<Buffer>;
  delete: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
} {
  // インメモリストレージ
  const files = new Map<string, Buffer>();

  return {
    files,

    // ファイルをアップロード
    upload: async (path: string, data: Buffer): Promise<string> => {
      files.set(path, data);
      return `https://storage.example.com/${path}`;
    },

    // ファイルをダウンロード
    download: async (path: string): Promise<Buffer> => {
      const file = files.get(path);
      if (!file) {
        throw new Error(`File not found: ${path}`);
      }
      return file;
    },

    // ファイルを削除
    delete: async (path: string): Promise<void> => {
      files.delete(path);
    },

    // ファイルの存在確認
    exists: async (path: string): Promise<boolean> => {
      return files.has(path);
    },
  };
}

/**
 * テスト用のダミーリクエストを作成する
 *
 * @param method - HTTPメソッド
 * @param url - リクエストURL
 * @param body - リクエストボディ
 * @param headers - リクエストヘッダー
 * @returns Requestオブジェクト
 * @example
 * const req = createTestRequest(
 *   'POST',
 *   '/api/projects',
 *   { name: 'Test Project' }
 * );
 */
export function createTestRequest(
  method: string,
  url: string,
  body?: any,
  headers: Record<string, string> = {}
): Request {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(`http://localhost${url}`, requestInit);
}
```

## 実行時間測定

### 処理時間計測

```typescript
// src/utils/performance/timing.ts

import { logger } from '@/utils/logging/logger';

/**
 * 関数の実行時間を測定する
 *
 * @param fn - 測定する関数
 * @param name - 測定名（ログ出力用）
 * @param logThreshold - ログ出力する閾値（ミリ秒）
 * @returns 関数の戻り値と実行時間
 * @example
 * const { result, duration } = await measureExecutionTime(
 *   async () => await fetchData(),
 *   'API Request'
 * );
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  name: string = 'anonymous',
  logThreshold?: number
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    // 閾値を超えた場合のみログ出力
    if (logThreshold !== undefined && duration > logThreshold) {
      logger.warn(
        `[Performance] ${name} took ${duration.toFixed(2)}ms (threshold: ${logThreshold}ms)`,
        {
          operation: name,
          durationMs: duration,
          threshold: logThreshold,
        }
      );
    } else {
      logger.debug(`[Performance] ${name} took ${duration.toFixed(2)}ms`, {
        operation: name,
        durationMs: duration,
      });
    }

    return { result, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`, {
      operation: name,
      durationMs: duration,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * 関数の実行時間を測定するデコレータ
 * クラスメソッドに使用する
 *
 * @param name - 測定名（省略時はメソッド名を使用）
 * @param logThreshold - ログ出力する閾値（ミリ秒）
 * @returns メソッドデコレータ
 * @example
 * class ApiService {
 *   @measureTime('fetchUserData')
 *   async fetchUser(id: string) {
 *     // 実装
 *   }
 * }
 */
export function measureTime(name?: string, logThreshold?: number): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const methodName = name || propertyKey.toString();

    descriptor.value = async function (...args: any[]) {
      const { result } = await measureExecutionTime(
        () => originalMethod.apply(this, args),
        methodName,
        logThreshold
      );

      return result;
    };

    return descriptor;
  };
}

/**
 * Web Vitalsのパフォーマンスマークを記録する
 * クライアントサイドでのみ動作
 *
 * @param markName - マーク名
 * @param details - 追加の詳細情報
 * @example
 * // ページロード開始時
 * markPerformance('app-load-start');
 *
 * // ページロード完了時
 * markPerformance('app-load-complete', {
 *   dataLoaded: true,
 *   componentCount: 5
 * });
 */
export function markPerformance(markName: string, details: Record<string, any> = {}): void {
  if (typeof window === 'undefined' || !window.performance || !window.performance.mark) {
    return;
  }

  try {
    // パフォーマンスマークを記録
    window.performance.mark(markName, { detail: details });

    // 開発環境ではコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Mark] ${markName}`, details);
    }
  } catch (error) {
    console.error(`Failed to create performance mark ${markName}:`, error);
  }
}

/**
 * 2つのパフォーマンスマーク間の測定を行う
 *
 * @param measureName - 測定名
 * @param startMark - 開始マーク名
 * @param endMark - 終了マーク名
 * @param reportCallback - 測定結果を処理するコールバック
 * @example
 * // マークの記録
 * markPerformance('render-start');
 * // ... コンポーネントレンダリング ...
 * markPerformance('render-end');
 *
 * // マーク間の測定
 * measurePerformance(
 *   'component-render-time',
 *   'render-start',
 *   'render-end',
 *   duration => console.log(`Render took ${duration}ms`)
 * );
 */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark: string,
  reportCallback?: (duration: number) => void
): void {
  if (typeof window === 'undefined' || !window.performance || !window.performance.measure) {
    return;
  }

  try {
    // マーク間の測定を作成
    const measure = window.performance.measure(measureName, startMark, endMark);

    // 測定結果をコールバックで処理
    if (reportCallback && measure && 'duration' in measure) {
      reportCallback(measure.duration);
    }

    // 開発環境ではコンソールにも出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance Measure] ${measureName}: ${measure?.duration ?? 'unknown'}ms`);
    }
  } catch (error) {
    console.error(`Failed to measure performance between ${startMark} and ${endMark}:`, error);
  }
}
```

## リソース使用状況測定

### メモリ使用量

```typescript
// src/utils/performance/resources.ts
'use server';

import { logger } from '@/utils/logging/logger';

/**
 * 現在のサーバーメモリ使用状況を監視する
 * サーバーサイドでのみ動作
 *
 * @returns メモリ使用統計
 * @example
 * const memoryStats = getMemoryUsage();
 * console.log(`Using ${memoryStats.usedMb}MB of ${memoryStats.totalMb}MB`);
 */
export function getMemoryUsage(): {
  rss: number; // Resident Set Size（実メモリ使用量）
  heapTotal: number; // V8によって割り当てられた合計メモリ
  heapUsed: number; // V8によって使用されているメモリ
  external: number; // V8が管理するJavaScriptオブジェクトに関連付けられた外部メモリ
  arrayBuffers: number; // ArrayBufferとSharedArrayBufferによって割り当てられたメモリ

  // 便宜上のMB単位の値
  rssMb: number;
  heapTotalMb: number;
  heapUsedMb: number;
  usagePercent: number;
} {
  if (typeof process === 'undefined') {
    throw new Error('getMemoryUsage can only be called on the server side');
  }

  // メモリ使用量を取得
  const memoryUsage = process.memoryUsage();

  // MB単位の値を計算
  const mbFactor = 1024 * 1024;
  const rssMb = Math.round((memoryUsage.rss / mbFactor) * 100) / 100;
  const heapTotalMb = Math.round((memoryUsage.heapTotal / mbFactor) * 100) / 100;
  const heapUsedMb = Math.round((memoryUsage.heapUsed / mbFactor) * 100) / 100;

  // ヒープ使用率を計算
  const usagePercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 10000) / 100;

  return {
    ...memoryUsage,
    rssMb,
    heapTotalMb,
    heapUsedMb,
    usagePercent,
  };
}

/**
 * メモリリークの可能性を検出する
 * 定期的に呼び出して使用パターンを監視する
 *
 * @param threshold - 警告する使用率の閾値（パーセント）
 * @param prev - 前回の測定値（オプション）
 * @returns 現在のメモリ使用統計
 * @example
 * let prevStats;
 *
 * // 1分ごとにメモリ使用状況をチェック
 * setInterval(() => {
 *   prevStats = detectMemoryLeak(85, prevStats);
 * }, 60000);
 */
export function detectMemoryLeak(
  threshold: number = 90,
  prev?: ReturnType<typeof getMemoryUsage>
): ReturnType<typeof getMemoryUsage> {
  const current = getMemoryUsage();

  // 閾値を超えている場合は警告
  if (current.usagePercent > threshold) {
    logger.warn(`高メモリ使用量を検出しました: ${current.usagePercent}%`, {
      memoryUsage: current,
      threshold,
    });
  }

  // 前回の測定値がある場合は増加率を計算
  if (prev) {
    const heapIncrease = current.heapUsed - prev.heapUsed;
    const increasePercent = (heapIncrease / prev.heapUsed) * 100;

    // 10%以上の急激な増加がある場合は警告
    if (increasePercent > 10) {
      logger.warn(`メモリ使用量の急増を検出しました: ${increasePercent.toFixed(2)}%増加`, {
        previousHeapUsed: prev.heapUsed,
        currentHeapUsed: current.heapUsed,
        increaseBytes: heapIncrease,
        increasePercent,
      });
    }
  }

  return current;
}

/**
 * 大規模データ処理中のメモリ使用量を監視する
 * 処理の各ステップでメモリ使用状況をログに記録
 *
 * @param operationName - 操作の名前
 * @param stepName - 現在のステップ名
 * @returns 現在のメモリ使用統計
 * @example
 * // データ処理の各ステップでメモリを監視
 * async function processLargeData() {
 *   monitorMemoryUsage('dataProcessing', 'start');
 *
 *   // データロード
 *   const data = await loadData();
 *   monitorMemoryUsage('dataProcessing', 'dataLoaded');
 *
 *   // 処理
 *   const results = processData(data);
 *   monitorMemoryUsage('dataProcessing', 'processed');
 *
 *   // 保存
 *   await saveResults(results);
 *   monitorMemoryUsage('dataProcessing', 'complete');
 * }
 */
export function monitorMemoryUsage(
  operationName: string,
  stepName: string
): ReturnType<typeof getMemoryUsage> {
  const stats = getMemoryUsage();

  logger.info(`[メモリ監視] ${operationName} - ${stepName}`, {
    operation: operationName,
    step: stepName,
    heapUsedMb: stats.heapUsedMb,
    rssMb: stats.rssMb,
    usagePercent: stats.usagePercent,
  });

  return stats;
}
```

## プロンプト管理

### テンプレート処理

```typescript
// src/utils/ai/promptTemplates.ts

/**
 * プロンプトテンプレートの変数を置換する
 *
 * @param template - 変数を含むテンプレート文字列
 * @param variables - 置換変数のマップ
 * @returns 変数が置換されたプロンプト
 * @example
 * const prompt = renderPromptTemplate(
 *   "こんにちは、{{name}}さん。今日の{{topic}}について教えてください。",
 *   { name: "田中", topic: "天気" }
 * );
 * // "こんにちは、田中さん。今日の天気について教えてください。"
 */
export function renderPromptTemplate(
  template: string,
  variables: Record<string, string | number | boolean>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (trimmedKey in variables) {
      return String(variables[trimmedKey]);
    }
    // 変数が見つからない場合は元のプレースホルダーを残す
    return match;
  });
}

/**
 * 複数パートからなるプロンプトを構築する
 *
 * @param parts - プロンプトの各パート
 * @returns 結合されたプロンプト
 * @example
 * const prompt = buildPrompt([
 *   "# プロジェクト概要",
 *   projectDescription,
 *   "# ユーザーの質問",
 *   userQuestion
 * ]);
 */
export function buildPrompt(parts: string[]): string {
  return parts.filter((part) => part !== undefined && part !== null && part !== '').join('\n\n');
}

/**
 * 異なるタイプのプロンプトテンプレートを管理するクラス
 */
export class PromptTemplateManager {
  private templates: Map<string, string> = new Map();

  /**
   * テンプレートを登録する
   *
   * @param key - テンプレートのキー
   * @param template - テンプレート文字列
   */
  registerTemplate(key: string, template: string): void {
    this.templates.set(key, template);
  }

  /**
   * 複数のテンプレートを一括登録する
   *
   * @param templates - キーとテンプレートのマップ
   */
  registerTemplates(templates: Record<string, string>): void {
    for (const [key, template] of Object.entries(templates)) {
      this.registerTemplate(key, template);
    }
  }

  /**
   * テンプレートを取得する
   *
   * @param key - テンプレートのキー
   * @returns テンプレート文字列
   * @throws Error - テンプレートが見つからない場合
   */
  getTemplate(key: string): string {
    const template = this.templates.get(key);
    if (!template) {
      throw new Error(`Template not found: ${key}`);
    }
    return template;
  }

  /**
   * テンプレートを変数で埋めて完成したプロンプトを返す
   *
   * @param key - テンプレートのキー
   * @param variables - 置換変数
   * @returns 完成したプロンプト
   */
  renderTemplate(key: string, variables: Record<string, string | number | boolean>): string {
    const template = this.getTemplate(key);
    return renderPromptTemplate(template, variables);
  }
}

// デフォルトのテンプレートマネージャーをエクスポート
export const promptTemplates = new PromptTemplateManager();

// 初期テンプレートを登録
promptTemplates.registerTemplates({
  'system:default': `あなたは役立つAIアシスタントです。ユーザーの質問に対して、簡潔かつ正確に回答してください。`,

  'system:code-assistant': `あなたはプログラミングのエキスパートです。コードの質問に対して、明確で実践的な回答を提供してください。例を示すときは、簡潔かつ効果的なコードスニペットを提供してください。`,

  'system:project-assistant': `あなたはプロジェクト管理のエキスパートです。以下のプロジェクト情報に基づいて、ユーザーのプロジェクト関連の質問に答えてください。

プロジェクト情報:
タイトル: {{projectTitle}}
説明: {{projectDescription}}
ステータス: {{projectStatus}}
進捗率: {{progressPercentage}}%`,

  'user:code-review': `以下のコードをレビューして、改善点があれば指摘してください。

\`\`\`{{language}}
{{code}}
\`\`\``,

  'user:step-instructions': `このステップでは「{{stepTitle}}」について作業します。

詳細: {{stepDescription}}

このステップを完了するために必要なことを教えてください。`,
});
```

### コンテキスト管理

```typescript
// src/utils/ai/contextManager.ts

import { Message } from '@/types/domain/Message';

/**
 * 会話履歴のコンテキスト管理クラス
 * AIモデルのトークン制限を考慮して最適なコンテキストを管理
 */
export class ConversationContext {
  private messages: Message[] = [];
  private maxTokenEstimate: number;
  private tokenCountEstimator: (text: string) => number;

  /**
   * コンテキストマネージャーを初期化
   *
   * @param maxTokens - 最大トークン数の目安
   * @param tokenEstimator - テキストのトークン数を推定する関数
   */
  constructor(
    maxTokens: number = 4000,
    tokenEstimator: (text: string) => number = defaultTokenEstimator
  ) {
    this.maxTokenEstimate = maxTokens;
    this.tokenCountEstimator = tokenEstimator;
  }

  /**
   * メッセージをコンテキストに追加
   *
   * @param message - 追加するメッセージ
   * @returns 追加後の全メッセージ
   */
  addMessage(message: Message): Message[] {
    this.messages.push(message);
    this.pruneToFitTokenLimit();
    return this.getMessages();
  }

  /**
   * 複数のメッセージをコンテキストに追加
   *
   * @param messages - 追加するメッセージの配列
   * @returns 追加後の全メッセージ
   */
  addMessages(messages: Message[]): Message[] {
    this.messages = [...this.messages, ...messages];
    this.pruneToFitTokenLimit();
    return this.getMessages();
  }

  /**
   * 現在のコンテキスト内のメッセージを取得
   *
   * @returns 現在のメッセージ配列
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * 現在のコンテキストをクリア
   */
  clearContext(): void {
    this.messages = [];
  }

  /**
   * 特定のメッセージを保持し、それ以外を削除
   *
   * @param messageIds - 保持するメッセージのID配列
   * @returns 保持後のメッセージ配列
   */
  keepOnlyMessages(messageIds: string[]): Message[] {
    this.messages = this.messages.filter((msg) => messageIds.includes(msg.id));
    return this.getMessages();
  }

  /**
   * 特定のタイプのメッセージのみ取得
   *
   * @param types - 取得するメッセージタイプの配列
   * @returns 指定タイプのメッセージ配列
   */
  getMessagesByType(types: Array<Message['type']>): Message[] {
    return this.messages.filter((msg) => types.includes(msg.type));
  }

  /**
   * コンテキストの現在のトークン数を推定
   *
   * @returns 推定トークン数
   */
  estimateTokenCount(): number {
    return this.messages.reduce((total, msg) => {
      return total + this.tokenCountEstimator(msg.content);
    }, 0);
  }

  /**
   * トークン制限内に収まるようにコンテキストを調整
   * 古いメッセージから削除していく
   */
  private pruneToFitTokenLimit(): void {
    let currentTokens = this.estimateTokenCount();

    // システムメッセージを識別（通常は保持したい）
    const systemMessages = this.messages.filter((msg) => msg.type === 'system');
    const nonSystemMessages = this.messages.filter((msg) => msg.type !== 'system');

    // トークン制限を超えている場合、古い非システムメッセージから削除
    while (currentTokens > this.maxTokenEstimate && nonSystemMessages.length > 0) {
      // 最も古いメッセージを削除
      const oldestMessage = nonSystemMessages.shift();
      if (oldestMessage) {
        // 実際のメッセージリストからも削除
        this.messages = this.messages.filter((msg) => msg.id !== oldestMessage.id);
        // トークン数を再計算
        currentTokens = this.estimateTokenCount();
      }
    }

    // 非システムメッセージを全て削除しても収まらない場合は
    // システムメッセージも削除対象に
    while (currentTokens > this.maxTokenEstimate && systemMessages.length > 0) {
      const oldestSystemMessage = systemMessages.shift();
      if (oldestSystemMessage) {
        this.messages = this.messages.filter((msg) => msg.id !== oldestSystemMessage.id);
        currentTokens = this.estimateTokenCount();
      }
    }
  }
}

/**
 * 簡易なトークン数推定関数
 * 英語の場合、単語の約3/4がトークンになる傾向
 * 日本語の場合、文字あたり約1.3トークン
 *
 * @param text - 推定するテキスト
 * @returns 推定トークン数
 */
function defaultTokenEstimator(text: string): number {
  if (!text) return 0;

  // 日本語文字を含むかチェック
  const hasJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(
    text
  );

  if (hasJapanese) {
    // 日本語テキストの場合、文字あたり約1.3トークン
    return Math.ceil(text.length * 1.3);
  } else {
    // 英語の場合、単語あたり約1.3トークン
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount * 1.3);
  }
}

/**
 * 会話の要約を生成する
 * 長い会話履歴をAIモデルのトークン制限内に収めるために使用
 *
 * @param messages - 要約する会話履歴
 * @param maxSummaryLength - 要約の最大長
 * @returns 要約されたメッセージ
 * @example
 * const summary = summarizeConversation(oldMessages, 500);
 * context.addMessage({
 *   id: 'summary-1',
 *   type: 'system',
 *   content: summary,
 *   conversationId: convId,
 *   createdAt: new Date()
 * });
 */
export function summarizeConversation(
  messages: Message[],
  maxSummaryLength: number = 1000
): string {
  if (messages.length === 0) {
    return '';
  }

  // システムメッセージを除外して会話だけを要約
  const conversationMessages = messages.filter((msg) => msg.type !== 'system');

  if (conversationMessages.length === 0) {
    return '';
  }

  // 会話の流れを構築
  const conversation = conversationMessages
    .map((msg) => {
      const role = msg.type === 'user' ? 'ユーザー' : 'アシスタント';
      // 長いメッセージは省略
      const content =
        msg.content.length > 100 ? `${msg.content.substring(0, 100)}...` : msg.content;

      return `${role}: ${content}`;
    })
    .join('\n\n');

  // 会話が既に制限内ならそのまま返す
  if (conversation.length <= maxSummaryLength) {
    return `以下は今までの会話の要約です:\n\n${conversation}`;
  }

  // 長すぎる場合は先頭と末尾の重要な部分を保持
  const headCount = Math.floor(maxSummaryLength * 0.3);
  const tailCount = Math.floor(maxSummaryLength * 0.7);

  const head = conversation.substring(0, headCount);
  const tail = conversation.substring(conversation.length - tailCount);

  return `以下は今までの会話の要約です:

# 会話の始まり
${head}

# 中略

# 最近の会話
${tail}`;
}
```

## AI APIラッパー

### プロバイダー抽象化

```typescript
// src/utils/ai/aiService.ts
'use server';

import { getEnv } from '@/utils/common/environment';
import { logger } from '@/utils/logging/logger';
import { Message } from '@/types/domain/Message';
import { withRetry, isAiServiceErrorRetryable } from '@/utils/errors/retryLogic';
import { ExternalServiceError } from '@/utils/errors/AppErrors';

/**
 * AIモデルのプロバイダータイプ
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'mock';

/**
 * AIモデルの設定
 */
export interface AIModelConfig {
  /**
   * モデル名
   */
  model: string;

  /**
   * プロバイダー
   */
  provider: AIProvider;

  /**
   * 最大出力トークン数
   */
  maxOutputTokens?: number;

  /**
   * 温度パラメータ（0.0-1.0）
   * 高いほどランダム性が増す
   */
  temperature?: number;

  /**
   * 使用する関数の定義
   */
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;

  /**
   * モデル固有のパラメータ
   */
  providerParams?: Record<string, any>;
}

/**
 * サポートするAIモデルの設定
 */
const MODEL_CONFIGS: Record<string, AIModelConfig> = {
  'gpt-4o': {
    model: 'gpt-4o',
    provider: 'openai',
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
  'claude-3-haiku': {
    model: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    maxOutputTokens: 4096,
    temperature: 0.7,
  },
  'gemini-pro': {
    model: 'gemini-pro',
    provider: 'google',
    maxOutputTokens: 2048,
    temperature: 0.7,
  },
  development: {
    model: 'development',
    provider: 'mock',
    maxOutputTokens: 1024,
    temperature: 0.7,
  },
};

/**
 * AIサービスの設定オプション
 */
export interface AIServiceOptions {
  /**
   * 使用するモデル
   */
  modelName: string;

  /**
   * 温度パラメータ（0.0-1.0）
   */
  temperature?: number;

  /**
   * 最大出力トークン数
   */
  maxOutputTokens?: number;

  /**
   * 使用する関数の定義
   */
  functions?: AIModelConfig['functions'];

  /**
   * プロバイダー固有のパラメータ
   */
  providerParams?: Record<string, any>;
}

/**
 * AIサービスの抽象クラス
 * 複数のAIプロバイダーを統一したインターフェースで扱う
 */
export class AIService {
  private config: AIModelConfig;

  /**
   * AIサービスを初期化
   *
   * @param options - AIサービスオプション
   */
  constructor(options: AIServiceOptions) {
    const baseConfig = MODEL_CONFIGS[options.modelName];

    if (!baseConfig) {
      throw new Error(`Unsupported model: ${options.modelName}`);
    }

    this.config = {
      ...baseConfig,
      temperature: options.temperature ?? baseConfig.temperature,
      maxOutputTokens: options.maxOutputTokens ?? baseConfig.maxOutputTokens,
      functions: options.functions,
      providerParams: {
        ...baseConfig.providerParams,
        ...options.providerParams,
      },
    };
  }

  /**
   * テキスト生成リクエストを実行
   *
   * @param messages - 会話履歴
   * @returns 生成されたテキスト
   * @throws ExternalServiceError - AIサービスとの通信に失敗した場合
   * @example
   * const response = await aiService.generateCompletion([
   *   { type: 'system', content: 'あなたは役立つアシスタントです' },
   *   { type: 'user', content: '東京の天気を教えて' }
   * ]);
   */
  async generateCompletion(messages: Message[]): Promise<string> {
    try {
      return await withRetry(
        async () => {
          switch (this.config.provider) {
            case 'openai':
              return await this.callOpenAI(messages);
            case 'anthropic':
              return await this.callAnthropic(messages);
            case 'google':
              return await this.callGoogle(messages);
            case 'mock':
              return await this.callMockService(messages);
            default:
              throw new Error(`Unsupported provider: ${this.config.provider}`);
          }
        },
        {
          maxRetries: 2,
          initialDelayMs: 1000,
          delayFactor: 2,
          isRetryable: isAiServiceErrorRetryable,
        }
      );
    } catch (error) {
      logger.error(
        'AIサービスとの通信に失敗しました',
        error instanceof Error ? error : new Error(String(error)),
        {
          provider: this.config.provider,
          model: this.config.model,
        }
      );

      throw new ExternalServiceError(
        'AI API',
        `AIサービス(${this.config.provider})との通信に失敗しました`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * ストリーミング形式でテキスト生成リクエストを実行
   *
   * @param messages - 会話履歴
   * @returns テキストチャンクを生成するAsyncGenerator
   * @example
   * const stream = aiService.generateCompletionStream(messages);
   * for await (const chunk of stream) {
   *   // チャンクを処理
   * }
   */
  async *generateCompletionStream(messages: Message[]): AsyncGenerator<string> {
    try {
      switch (this.config.provider) {
        case 'openai':
          yield* this.streamOpenAI(messages);
          break;
        case 'anthropic':
          yield* this.streamAnthropic(messages);
          break;
        case 'google':
          yield* this.streamGoogle(messages);
          break;
        case 'mock':
          yield* this.streamMockService(messages);
          break;
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error(
        'AIストリーミングサービスとの通信に失敗しました',
        error instanceof Error ? error : new Error(String(error)),
        {
          provider: this.config.provider,
          model: this.config.model,
        }
      );

      throw new ExternalServiceError(
        'AI API',
        `AIストリーミングサービス(${this.config.provider})との通信に失敗しました`,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * OpenAI APIを呼び出す
   *
   * @param messages - 会話履歴
   * @returns 生成されたテキスト
   * @private
   */
  private async callOpenAI(messages: Message[]): Promise<string> {
    // OpenAI API実装
    // 実際の実装では、OpenAI SDKを使用

    const formattedMessages = messages.map((msg) => ({
      role: msg.type === 'user' ? 'user' : msg.type === 'assistant' ? 'assistant' : 'system',
      content: msg.content,
    }));

    const apiKey = getEnv('OPENAI_API_KEY', true);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: formattedMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxOutputTokens,
        ...(this.config.functions && {
          functions: this.config.functions,
          function_call: 'auto',
        }),
        ...this.config.providerParams,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || '';
  }

  /**
   * OpenAI APIをストリーミングモードで呼び出す
   *
   * @param messages - 会話履歴
   * @yields 生成されたテキストチャンク
   * @private
   */
  private async *streamOpenAI(messages: Message[]): AsyncGenerator<string> {
    // OpenAI ストリーミング API実装
    // 省略
    yield 'OpenAI streaming not implemented in this example';
  }

  /**
   * Anthropic APIを呼び出す
   *
   * @param messages - 会話履歴
   * @returns 生成されたテキスト
   * @private
   */
  private async callAnthropic(messages: Message[]): Promise<string> {
    // Anthropic API実装
    // 省略
    return 'Anthropic API not implemented in this example';
  }

  /**
   * Anthropic APIをストリーミングモードで呼び出す
   *
   * @param messages - 会話履歴
   * @yields 生成されたテキストチャンク
   * @private
   */
  private async *streamAnthropic(messages: Message[]): AsyncGenerator<string> {
    // Anthropic ストリーミング API実装
    // 省略
    yield 'Anthropic streaming not implemented in this example';
  }

  /**
   * Google AI APIを呼び出す
   *
   * @param messages - 会話履歴
   * @returns 生成されたテキスト
   * @private
   */
  private async callGoogle(messages: Message[]): Promise<string> {
    // Google AI API実装
    // 省略
    return 'Google AI API not implemented in this example';
  }

  /**
   * Google AI APIをストリーミングモードで呼び出す
   *
   * @param messages - 会話履歴
   * @yields 生成されたテキストチャンク
   * @private
   */
  private async *streamGoogle(messages: Message[]): AsyncGenerator<string> {
    // Google AI ストリーミング API実装
    // 省略
    yield 'Google AI streaming not implemented in this example';
  }

  /**
   * 開発用のモックサービスを呼び出す
   *
   * @param messages - 会話履歴
   * @returns 生成されたテキスト
   * @private
   */
  private async callMockService(messages: Message[]): Promise<string> {
    // 開発用のモックレスポンス
    await new Promise((resolve) => setTimeout(resolve, 500));

    const lastMessage = messages.filter((m) => m.type === 'user').pop();
    if (!lastMessage) {
      return 'すみません、ご質問を理解できませんでした。';
    }

    const userMessage = lastMessage.content.toLowerCase();

    if (userMessage.includes('こんにちは') || userMessage.includes('hello')) {
      return 'こんにちは！お手伝いできることがあれば、お気軽にお尋ねください。';
    } else if (userMessage.includes('天気')) {
      return '申し訳ありませんが、リアルタイムの天気情報にはアクセスできません。天気予報サービスをご利用ください。';
    } else if (userMessage.includes('help') || userMessage.includes('ヘルプ')) {
      return '現在モック環境で実行中です。このAIアシスタントは開発環境用のシミュレーションです。';
    }

    return 'ご質問ありがとうございます。現在開発環境で実行中のため、限定的な応答しかできません。本番環境では実際のAIモデルが応答します。';
  }

  /**
   * 開発用のモックサービスをストリーミングモードで呼び出す
   *
   * @param messages - 会話履歴
   * @yields 生成されたテキストチャンク
   * @private
   */
  private async *streamMockService(messages: Message[]): AsyncGenerator<string> {
    const response = await this.callMockService(messages);
    const chunks = response.split(' ');

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield chunk + ' ';
    }
  }
}

/**
 * デフォルトのAIサービスインスタンスを作成
 *
 * @returns 設定済みのAIサービスインスタンス
 */
export function createDefaultAIService(): AIService {
  const defaultModel = getEnv('AI_DEFAULT_MODEL', false, 'development');

  return new AIService({
    modelName: defaultModel,
  });
}

// デフォルトのAIサービスをエクスポート
export const aiService = createDefaultAIService();
```
