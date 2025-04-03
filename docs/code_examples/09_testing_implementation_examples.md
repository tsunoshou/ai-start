# テスト実装コード例集 (09_testing_implementation.md 対応)

最終更新日: 2024-07-27

このドキュメントは、[09_testing_implementation.md](/docs/restructuring/09_testing_implementation.md) で説明されているテスト実装方針に関する具体的なコード例を提供します。先行するドキュメント (01-08) との整合性を保っています。

## ユニットテストの例

### ドメインエンティティのテスト例

```typescript
// tests/domain/models/Project.test.ts
import { describe, it, expect } from 'vitest';
import { Project, ProjectId, ProjectStatus } from '@/domain/models/Project';
import { UserId } from '@/domain/models/User';

describe('Project', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000' as UserId;
  const projectId = '123e4567-e89b-12d3-a456-426614174001' as ProjectId;

  it('プロジェクトが適切に作成される', () => {
    const project = Project.create({
      name: 'テストプロジェクト',
      description: 'テスト用プロジェクトの説明',
      ownerId: userId,
    });

    expect(project.name).toBe('テストプロジェクト');
    expect(project.description).toBe('テスト用プロジェクトの説明');
    expect(project.ownerId).toBe(userId);
    expect(project.status).toBe(ProjectStatus.DRAFT);
    expect(project.id).toBeDefined();
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });

  it('プロジェクト名が不適切な場合はエラーが発生する', () => {
    expect(() => 
      Project.create({
        name: '', // 空文字列
        description: 'テスト用プロジェクトの説明',
        ownerId: userId,
      })
    ).toThrow('プロジェクト名は必須です');
    
    expect(() => 
      Project.create({
        name: 'a'.repeat(101), // 文字数超過
        description: 'テスト用プロジェクトの説明',
        ownerId: userId,
      })
    ).toThrow('プロジェクト名は100文字以内である必要があります');
  });

  it('プロジェクトのステータスを変更できる', () => {
    const project = Project.restore({
      id: projectId,
      name: 'テストプロジェクト',
      description: 'テスト用プロジェクトの説明',
      ownerId: userId,
      status: ProjectStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updatedProject = project.changeStatus(ProjectStatus.IN_PROGRESS);
    
    expect(updatedProject.status).toBe(ProjectStatus.IN_PROGRESS);
    // 更新日時が変更されていることを確認
    expect(updatedProject.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
  });
});
```

### ユーティリティ関数のテスト例

```typescript
// tests/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatRelativeTime } from '@/utils/formatDate';

describe('日付フォーマット関数', () => {
  it('formatDate: 日付を適切にフォーマットする', () => {
    const date = new Date('2023-10-15T12:30:45Z');
    expect(formatDate(date)).toBe('2023/10/15');
    expect(formatDate(date, 'ja-JP')).toBe('2023年10月15日');
    expect(formatDate(date, 'en-US')).toBe('10/15/2023');
  });

  it('formatDateTime: 日時を適切にフォーマットする', () => {
    const date = new Date('2023-10-15T12:30:45Z');
    
    // デフォルトのタイムゾーン（実行環境に依存するためテストが不安定になる可能性あり）
    const formattedDefault = formatDateTime(date);
    expect(formattedDefault).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    
    // タイムゾーン指定
    expect(formatDateTime(date, { timeZone: 'UTC' })).toBe('2023/10/15 12:30');
    expect(formatDateTime(date, { timeZone: 'Asia/Tokyo' })).toBe('2023/10/15 21:30');
  });

  it('formatRelativeTime: 相対時間を適切にフォーマットする', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1分前');
    expect(formatRelativeTime(oneHourAgo)).toBe('1時間前');
    expect(formatRelativeTime(oneDayAgo)).toBe('1日前');
    
    expect(formatRelativeTime(oneMinuteAgo, 'en-US')).toBe('1 minute ago');
    expect(formatRelativeTime(oneHourAgo, 'en-US')).toBe('1 hour ago');
    expect(formatRelativeTime(oneDayAgo, 'en-US')).toBe('1 day ago');
  });
});
```

## 統合テストの例

### APIエンドポイントのテスト例

```typescript
// tests/api/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import supertest from 'supertest';
import handler from '@/app/api/v1/projects/route';
import { setupTestDatabase, teardownTestDatabase } from '@/tests/utils/db-test-utils';
import { mockAuthSession } from '@/tests/utils/auth-test-utils';

describe('プロジェクトAPI', () => {
  let server: ReturnType<typeof createServer>;
  let request: ReturnType<typeof supertest>;
  
  beforeEach(async () => {
    // テスト用DBの設定
    await setupTestDatabase();
    
    // テスト用サーバーの作成
    server = createServer((req, res) => {
      return apiResolver(
        req,
        res,
        undefined,
        handler,
        {
          previewModeEncryptionKey: '',
          previewModeId: '',
          previewModeSigningKey: '',
        },
        false
      );
    });
    
    request = supertest(server);
  });
  
  afterEach(async () => {
    // テスト用DBの破棄
    await teardownTestDatabase();
  });
  
  it('GET /api/v1/projects: 認証済みユーザーは自分のプロジェクト一覧を取得できる', async () => {
    // 認証済みユーザーモックの設定
    const { userId } = await mockAuthSession();
    
    const response = await request
      .get('/api/v1/projects')
      .set('Cookie', [`auth-session=${userId}`]);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    // 自分のプロジェクトのみが返されていることを確認
    expect(response.body.data.every((project: any) => project.ownerId === userId)).toBe(true);
  });
  
  // 他のテストケース...
});
```

### リポジトリ実装のテスト例 (RLSを含む)

```typescript
// tests/infrastructure/repositories/ProjectRepositoryImpl.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { container } from 'tsyringe';
import { ProjectRepository } from '@/domain/repositories/ProjectRepository';
import { ProjectRepositoryImpl } from '@/infrastructure/database/repositories/ProjectRepositoryImpl';
import { setupTestDatabase, teardownTestDatabase } from '@/tests/utils/db-test-utils';
import { Project, ProjectId, ProjectStatus } from '@/domain/models/Project';
import { UserId } from '@/domain/models/User';
import { mockDatabaseClient } from '@/tests/utils/db-test-utils';

describe('ProjectRepositoryImpl (RLS含む)', () => {
  const testUserId1 = '123e4567-e89b-12d3-a456-426614174000' as UserId;
  const testUserId2 = '123e4567-e89b-12d3-a456-426614174001' as UserId;
  let projectRepository: ProjectRepository;
  
  beforeEach(async () => {
    // テスト用DBの設定
    await setupTestDatabase();
    
    // RLSポリシーが適用されたDBクライアント（特定ユーザーのコンテキストでクエリ実行）
    const dbClient = mockDatabaseClient(testUserId1);
    
    // DIコンテナにリポジトリを登録
    container.register(ProjectRepository, { useValue: new ProjectRepositoryImpl(dbClient) });
    projectRepository = container.resolve(ProjectRepository);
    
    // テストプロジェクトデータを投入
    await seedTestProjects();
  });
  
  afterEach(async () => {
    // テスト用DBの破棄
    await teardownTestDatabase();
    container.clearInstances();
  });
  
  it('findById: 自分のプロジェクトは取得できるが、他のユーザーのプロジェクトは取得できない (RLS検証)', async () => {
    // 自分のプロジェクト
    const myProjectId = 'project-1' as ProjectId; // ユーザー1のプロジェクト
    const otherUserProjectId = 'project-2' as ProjectId; // ユーザー2のプロジェクト
    
    // 自分のプロジェクトは取得できる
    const myProject = await projectRepository.findById(myProjectId);
    expect(myProject).not.toBeNull();
    expect(myProject?.id).toBe(myProjectId);
    expect(myProject?.ownerId).toBe(testUserId1);
    
    // 他のユーザーのプロジェクトはnullが返る (RLSによりレコードが見えない)
    const otherUserProject = await projectRepository.findById(otherUserProjectId);
    expect(otherUserProject).toBeNull();
  });
  
  // 他のテストケース...
});
```

## E2Eテストの例 (Playwright)

```typescript
// e2e/login-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ログインフロー', () => {
  test('有効なクレデンシャルでログインできる', async ({ page }) => {
    // ログインページにアクセス
    await page.goto('/auth/login');
    
    // フォームに入力
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard');
    
    // ログイン成功後のUI要素が表示されていることを確認
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('無効なクレデンシャルでログインできない', async ({ page }) => {
    // ログインページにアクセス
    await page.goto('/auth/login');
    
    // 無効なクレデンシャルを入力
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ログインページにとどまることを確認
    await expect(page).toHaveURL('/auth/login');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText('メールアドレスまたはパスワードが正しくありません');
  });
});
```

## AIサービス統合テスト例

```typescript
// tests/infrastructure/ai/OpenAIServiceImpl.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIServiceImpl } from '@/infrastructure/ai/OpenAIServiceImpl';
import { AIServiceConfig } from '@/domain/services/AIService';
import { ConversationType } from '@/domain/models/Conversation';
import { Result } from '@/utils/Result';
import { AppError, ErrorCode } from '@/domain/errors/AppError';

describe('OpenAIServiceImpl', () => {
  let openAIService: OpenAIServiceImpl;
  
  // OpenAI APIのモック
  const mockChatCompletions = {
    create: vi.fn(),
  };
  
  // モックの設定
  beforeEach(() => {
    vi.mock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: mockChatCompletions,
        },
      })),
    }));
    
    // サービスのインスタンス化
    openAIService = new OpenAIServiceImpl({
      apiKey: 'mock-api-key',
      defaultModel: 'gpt-4o',
      timeout: 30000,
    } as AIServiceConfig);
  });
  
  it('正常なレスポンスを処理できる', async () => {
    // モックレスポンスの設定
    mockChatCompletions.create.mockResolvedValue({
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'こんにちは、お手伝いできることはありますか？',
          },
          index: 0,
          finish_reason: 'stop',
        },
      ],
    });
    
    const result = await openAIService.generateChatCompletion({
      conversationType: ConversationType.INITIAL,
      messages: [
        { role: 'system', content: 'あなたは優秀なアシスタントです。' },
        { role: 'user', content: 'こんにちは' },
      ],
    });
    
    // 成功レスポンスを返すことを確認
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.content).toBe('こんにちは、お手伝いできることはありますか？');
      expect(result.value.role).toBe('assistant');
    }
    
    // 正しいパラメータでAPIが呼ばれたことを確認
    expect(mockChatCompletions.create).toHaveBeenCalledWith({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'あなたは優秀なアシスタントです。' },
        { role: 'user', content: 'こんにちは' },
      ],
      temperature: expect.any(Number),
      max_tokens: expect.any(Number),
    });
  });
  
  it('APIエラーを適切に処理する', async () => {
    // APIエラーをモック
    mockChatCompletions.create.mockRejectedValue(new Error('API rate limit exceeded'));
    
    const result = await openAIService.generateChatCompletion({
      conversationType: ConversationType.INITIAL,
      messages: [
        { role: 'system', content: 'あなたは優秀なアシスタントです。' },
        { role: 'user', content: 'こんにちは' },
      ],
    });
    
    // エラー結果を返すことを確認
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.AI_SERVICE_ERROR);
      expect(result.error.message).toContain('API rate limit exceeded');
    }
  });
  
  it('タイムアウトを適切に処理する', async () => {
    // タイムアウトをモック
    mockChatCompletions.create.mockImplementation(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 100);
    }));
    
    // タイムアウト設定を短くしたサービスインスタンス
    const timeoutService = new OpenAIServiceImpl({
      apiKey: 'mock-api-key',
      defaultModel: 'gpt-4o',
      timeout: 50, // 50ms
    } as AIServiceConfig);
    
    const result = await timeoutService.generateChatCompletion({
      conversationType: ConversationType.INITIAL,
      messages: [{ role: 'user', content: 'こんにちは' }],
    });
    
    // タイムアウトエラーを返すことを確認
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.AI_SERVICE_TIMEOUT);
    }
  });
});
```

## テストデータ管理の例

### ファクトリ関数例

```typescript
// tests/factories/projectFactory.ts
import { faker } from '@faker-js/faker';
import { Project, ProjectId, ProjectStatus } from '@/domain/models/Project';
import { UserId } from '@/domain/models/User';

/**
 * テスト用プロジェクトの生成
 */
export function createTestProject(override: Partial<Project> = {}): Project {
  const defaultProject = {
    id: faker.string.uuid() as ProjectId,
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    ownerId: faker.string.uuid() as UserId,
    status: ProjectStatus.DRAFT,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  
  return {
    ...defaultProject,
    ...override,
  } as Project;
}

/**
 * 複数のテストプロジェクトを生成
 */
export function createTestProjects(count: number, override: Partial<Project> = {}): Project[] {
  return Array.from({ length: count }, () => createTestProject(override));
}

/**
 * 特定ユーザーに紐づくテストプロジェクトを生成
 */
export function createUserProjects(userId: UserId, count: number): Project[] {
  return createTestProjects(count, { ownerId: userId });
}
```

### テストDB設定ユーティリティ例

```typescript
// tests/utils/db-test-utils.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@/config/env';
import * as schema from '@/infrastructure/database/schema';

// テスト用のランダムスキーマ名を生成
const getTestSchemaName = () => `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
let currentTestSchema: string | null = null;

/**
 * テスト用データベース環境のセットアップ
 * - 一意のスキーマを作成
 * - マイグレーションを実行
 * - テストデータを投入（オプション）
 */
export async function setupTestDatabase(seedData = false) {
  // テスト用の一意のスキーマ名を生成
  currentTestSchema = getTestSchemaName();
  
  // PostgreSQLクライアント作成
  const client = postgres(env.DATABASE_URL);
  
  try {
    // テスト用スキーマ作成
    await client.unsafe(`CREATE SCHEMA IF NOT EXISTS ${currentTestSchema}`);
    
    // テスト用スキーマのコンテキストでマイグレーション実行
    const db = drizzle(client, { schema, schema: currentTestSchema });
    await migrate(db, { migrationsFolder: './drizzle' });
    
    // テストデータの投入（必要な場合）
    if (seedData) {
      await seedTestDatabase(currentTestSchema);
    }
    
    return currentTestSchema;
  } catch (error) {
    console.error('テスト用DB設定エラー:', error);
    throw error;
  }
}

/**
 * テスト用データベースの破棄
 */
export async function teardownTestDatabase() {
  if (!currentTestSchema) return;
  
  const client = postgres(env.DATABASE_URL);
  
  try {
    // スキーマとその中の全てのオブジェクトを削除
    await client.unsafe(`DROP SCHEMA IF EXISTS ${currentTestSchema} CASCADE`);
    await client.end();
    currentTestSchema = null;
  } catch (error) {
    console.error('テストDB破棄エラー:', error);
    throw error;
  }
}

/**
 * 特定ユーザーのコンテキストでRLSが適用されたDBクライアントを返す
 * (スーパーユーザーはRLSをバイパスするため、RLSのテストにはこの関数を使用)
 */
export function mockDatabaseClient(userId: string, schemaName = currentTestSchema) {
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
    connection: {
      // RLSポリシーが参照するauth.uidを設定
      options: `--search_path=${schemaName} --set=auth.uid=${userId}`,
    },
  });
  
  return drizzle(client, { schema, schema: schemaName });
}

/**
 * テストデータの投入
 */
async function seedTestDatabase(schemaName: string) {
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema, schema: schemaName });
  
  // テストユーザーの作成
  // プロジェクトの作成
  // その他必要なテストデータの投入
  
  await client.end();
}
```

## 特別なテストケース例

### フォームバリデーションのテスト (React Hook Form + Zod)

```typescript
// tests/hooks/useProfileForm.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect } from 'vitest';
import { useProfileForm } from '@/hooks/useProfileForm';

describe('useProfileForm', () => {
  it('有効なデータでフォームを送信できる', async () => {
    const onSuccess = vi.fn();
    
    const { result } = renderHook(() => useProfileForm({ onSuccess }));
    
    // 有効なデータをフォームに設定
    await act(async () => {
      result.current.form.setValue('name', '山田 太郎');
      result.current.form.setValue('email', 'taro@example.com');
      result.current.form.setValue('bio', '自己紹介文です。');
    });
    
    // フォーム送信
    await act(async () => {
      await result.current.form.handleSubmit((data) => {
        result.current.onSubmit(data);
      })();
    });
    
    // 成功コールバックが呼ばれたことを確認
    expect(onSuccess).toHaveBeenCalledWith({
      name: '山田 太郎',
      email: 'taro@example.com',
      bio: '自己紹介文です。',
    });
    
    // バリデーションエラーがないことを確認
    expect(result.current.form.formState.errors).toEqual({});
  });
  
  it('無効なデータではバリデーションエラーが発生する', async () => {
    const { result } = renderHook(() => useProfileForm({ onSuccess: vi.fn() }));
    
    // 無効なデータをフォームに設定
    await act(async () => {
      result.current.form.setValue('name', ''); // 名前は必須
      result.current.form.setValue('email', 'invalid-email'); // 無効なメールアドレス
    });
    
    // フォーム送信
    await act(async () => {
      await result.current.form.handleSubmit((data) => {
        result.current.onSubmit(data);
      })();
    });
    
    // バリデーションエラーを確認
    expect(result.current.form.formState.errors.name).toBeDefined();
    expect(result.current.form.formState.errors.name?.message).toBe('名前は必須です');
    expect(result.current.form.formState.errors.email).toBeDefined();
    expect(result.current.form.formState.errors.email?.message).toBe('有効なメールアドレスを入力してください');
  });
});
```

### 認証・認可のテスト (ミドルウェア)

```typescript
// tests/middleware/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { middleware } from '@/middleware';
import { getSession } from '@/utils/auth';

// getSessionのモック
vi.mock('@/utils/auth', () => ({
  getSession: vi.fn(),
}));

describe('認証・認可ミドルウェア', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('認証されていないユーザーは認証必須ページにアクセスするとログインページにリダイレクトされる', async () => {
    // 未認証状態をモック
    (getSession as any).mockResolvedValue(null);
    
    // /dashboardへのリクエストをモック
    const { req } = createMocks({
      method: 'GET',
      url: '/dashboard',
    });
    
    const request = new NextRequest(new URL('http://localhost/dashboard'), {
      request: req as any,
    });
    
    const response = await middleware(request);
    
    // ログインページへのリダイレクトが返されることを確認
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(307); // Temporary redirect
    expect(response?.headers.get('Location')).toBe('/auth/login?callbackUrl=%2Fdashboard');
  });
  
  it('一般ユーザーは管理者ページにアクセスできない', async () => {
    // 一般ユーザーの認証状態をモック
    (getSession as any).mockResolvedValue({
      user: {
        id: 'user-123',
        roles: ['User'],
      },
    });
    
    // /admin/usersへのリクエストをモック
    const { req } = createMocks({
      method: 'GET',
      url: '/admin/users',
    });
    
    const request = new NextRequest(new URL('http://localhost/admin/users'), {
      request: req as any,
    });
    
    const response = await middleware(request);
    
    // 403 Forbiddenが返されることを確認
    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(403);
  });
  
  it('管理者ユーザーは管理者ページにアクセスできる', async () => {
    // 管理者ユーザーの認証状態をモック
    (getSession as any).mockResolvedValue({
      user: {
        id: 'admin-123',
        roles: ['Admin'],
      },
    });
    
    // /admin/usersへのリクエストをモック
    const { req } = createMocks({
      method: 'GET',
      url: '/admin/users',
    });
    
    const request = new NextRequest(new URL('http://localhost/admin/users'), {
      request: req as any,
    });
    
    const response = await middleware(request);
    
    // 通過することを確認（レスポンスがnullまたはnextメソッドが呼ばれる）
    expect(response).toBeNull();
  });
});
```

これらのコード例は、[09_testing_implementation.md](/docs/restructuring/09_testing_implementation.md) で説明されたテスト戦略を具体的に実装する方法を示しています。実際のプロジェクトでは、これらの例をベースに、アプリケーション固有の要件に合わせて適宜調整してください。 