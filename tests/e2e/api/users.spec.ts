import { test, expect } from '@playwright/test';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import drizzleConfig from '../../../drizzle.config';

// コンテナとDB接続情報を保持する変数
let postgresContainer: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof drizzle>;

// 不要な警告を回避するためのloggerオプション（実際の環境に合わせて調整してください）
const QUIET_LOGGER = {
  logQuery: () => {}, // クエリをログに出力しない
};

// テスト対象のAPIエンドポイント
const USER_API_BASE_URL = '/api/users';

// テスト間で共有するユーザーID
let createdUserId: string | null = null;

test.describe.serial('ユーザーAPI (E2E)', () => {
  test.beforeAll(async () => {
    console.log('🔧 PostgreSQLコンテナを起動中...');

    try {
      // PostgreSQLコンテナを起動
      postgresContainer = await new PostgreSqlContainer('postgres:16')
        .withDatabase('testdb')
        .withUsername('testuser')
        .withPassword('testpass')
        .start();

      console.log('✅ PostgreSQLコンテナ起動完了');
      console.log(`📦 接続情報: ${postgresContainer.getConnectionUri()}`);

      // DB接続プールを作成
      pool = new Pool({
        connectionString: postgresContainer.getConnectionUri(),
      });

      // drizzleインスタンスの初期化
      db = drizzle(pool, { logger: QUIET_LOGGER });

      // マイグレーション実行（drizzle.config.tsで定義されたmigrationsフォルダを使用）
      console.log('🔧 マイグレーション実行中...');
      await migrate(db, {
        migrationsFolder: drizzleConfig.out,
      });
      console.log('✅ マイグレーション実行完了');
    } catch (error) {
      console.error('💥 テスト環境セットアップでエラー発生:', error);
      await cleanupResources();
      throw error;
    }
  });

  test.afterAll(async () => {
    await cleanupResources();
  });

  // リソース解放用ヘルパー関数
  async function cleanupResources() {
    if (pool) {
      console.log('🧹 DB接続プールをクローズ中...');
      await pool.end();
    }
    if (postgresContainer) {
      console.log('🧹 PostgreSQLコンテナを停止中...');
      await postgresContainer.stop();
    }
    console.log('✅ テスト環境のクリーンアップ完了');
  }

  test.beforeEach(async () => {
    // 各テスト前に実行されるセットアップ関数
    // テスト間の依存関係をなくすために、ユーザーを作成しておく
    if (!createdUserId) {
      try {
        // 新しいユーザーを作成してIDを取得
        const newUserResponse = await fetch(
          `${process.env.BASE_URL || 'http://localhost:3000'}${USER_API_BASE_URL}`,
          {
            method: 'POST',
            headers: { contentType: 'application/json' },
            body: JSON.stringify({
              name: 'Test Setup User',
              email: `setup-${Date.now()}@example.com`,
              passwordPlainText: 'Password123!',
            }),
          }
        );

        // 成功した場合はIDを取得
        if (newUserResponse.status === 201) {
          const data = await newUserResponse.json();
          if (data.success && data.data && data.data.id) {
            createdUserId = data.data.id;
            console.log(`📝 テスト用ユーザーを作成しました: ${createdUserId}`);
          }
        }
      } catch (error) {
        console.error('⚠️ テスト用ユーザー作成に失敗しました:', error);
      }
    }
  });

  test('1. POST /api/users - 新規ユーザーを作成できる', async ({ request }) => {
    // テスト用ユーザーデータ
    const randomString = Math.random().toString(36).substring(7);
    const uniqueEmail = `test-${Date.now()}-${randomString}@example.com`;
    const newUser = {
      name: 'テストユーザー',
      email: uniqueEmail,
      passwordPlainText: 'Password123!',
    };

    let testUserId: string | null = null; // このテストで作成したユーザーIDを保持

    try {
      // APIリクエスト実行
      const response = await request.post(USER_API_BASE_URL, {
        data: newUser,
      });

      // レスポンスの検証 - 成功(201)のみを期待
      expect(response.status()).toBe(201);

      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('id');
      expect(responseData.data.name).toBe(newUser.name);
      expect(responseData.data.email).toBe(newUser.email);

      // パスワード関連の情報がレスポンスに含まれていないことを確認
      expect(responseData.data).not.toHaveProperty('passwordHash');
      expect(responseData.data).not.toHaveProperty('passwordPlainText');

      // このテストで作成したユーザーのIDを保存
      testUserId = responseData.data.id;
    } finally {
      // テスト終了時に、このテストで作成したユーザーがいれば削除する
      if (testUserId) {
        try {
          await request.delete(`${USER_API_BASE_URL}/${testUserId}`);
          console.log(`🧹 テスト1で作成したユーザー (${testUserId}) を削除しました。`);
        } catch (deleteError) {
          console.error(
            `⚠️ テスト1で作成したユーザー (${testUserId}) の削除に失敗しました:`,
            deleteError
          );
        }
      }
    }
  });

  test('2. GET /api/users - ユーザー一覧を取得できる', async ({ request }) => {
    const response = await request.get(USER_API_BASE_URL);

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);

    // ユーザー一覧が空でないことを確認
    expect(responseData.data.length).toBeGreaterThan(0);

    // 最初のユーザーが必須フィールドを持っていることを確認
    if (responseData.data.length > 0) {
      const firstUser = responseData.data[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('email');
    }
  });

  test('3. GET /api/users/:id - 特定のユーザーを取得できる', async ({ request }) => {
    // テスト前に必ずユーザーが存在することを確認
    await ensureTestUserExists(request);

    const response = await request.get(`${USER_API_BASE_URL}/${createdUserId}`);

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe(createdUserId);
  });

  test('4. GET /api/users/:id - 存在しないユーザーIDでは404エラーが返る', async ({ request }) => {
    // 存在しないランダムなUUID
    const nonExistentId = '00000000-0000-4000-a000-000000000000';
    const response = await request.get(`${USER_API_BASE_URL}/${nonExistentId}`);

    expect(response.status()).toBe(404);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'NOT_FOUND');
  });

  test('5. PATCH /api/users/:id - ユーザー情報を更新できる', async ({ request }) => {
    // テスト前に必ずユーザーが存在することを確認
    await ensureTestUserExists(request);

    const updateData = {
      name: '更新後テストユーザー',
    };

    const response = await request.patch(`${USER_API_BASE_URL}/${createdUserId}`, {
      data: updateData,
    });

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe(createdUserId);
    expect(responseData.data.name).toBe(updateData.name);
  });

  test('6. DELETE /api/users/:id - ユーザーを削除できる', async ({ request }) => {
    // 新しいユーザーを作成してそれを削除するテスト
    // 共通ユーザーを削除すると後続のテストが失敗するため
    const newUserResponse = await request.post(USER_API_BASE_URL, {
      data: {
        name: '削除用テストユーザー',
        email: `delete-test-${Date.now()}@example.com`,
        passwordPlainText: 'Password123!',
      },
    });

    if (newUserResponse.status() === 201) {
      const userData = await newUserResponse.json();
      const userIdToDelete = userData.data.id;

      // 削除リクエスト実行
      const response = await request.delete(`${USER_API_BASE_URL}/${userIdToDelete}`);

      // 成功時は204 No Content
      expect(response.status()).toBe(204);

      // 削除後に再度取得を試みて404エラーになることを確認
      const getResponse = await request.get(`${USER_API_BASE_URL}/${userIdToDelete}`);
      expect(getResponse.status()).toBe(404);
    } else {
      // ユーザー作成に失敗した場合はテストをスキップ
      test.skip(true, 'ユーザー作成に失敗したためテストをスキップします');
    }
  });

  // 失敗系のテスト
  test('7. POST /api/users - バリデーションエラー（不正な形式のメール）', async ({ request }) => {
    const invalidUser = {
      name: 'Invalid User',
      email: 'invalid-email', // 不正な形式のメール
      passwordPlainText: 'password123',
    };

    const response = await request.post(USER_API_BASE_URL, {
      data: invalidUser,
    });

    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('8. POST /api/users - バリデーションエラー（短すぎるパスワード）', async ({ request }) => {
    const invalidUser = {
      name: 'Invalid User',
      email: 'valid@example.com',
      passwordPlainText: '123', // 短すぎるパスワード
    };

    const response = await request.post(USER_API_BASE_URL, {
      data: invalidUser,
    });

    expect(response.status()).toBe(400);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('9. POST /api/users - 既存メールアドレスでのエラー', async ({ request }) => {
    // 独自のメールアドレスを使用
    const email = `duplicate-${Date.now()}@example.com`;

    // 最初に正常にユーザーを作成
    const newUser = {
      name: 'Duplicate Email User',
      email,
      passwordPlainText: 'Password123!',
    };

    const firstResponse = await request.post(USER_API_BASE_URL, { data: newUser });

    // 最初の作成が成功した場合のみテストを継続
    if (firstResponse.status() === 201) {
      // 同じメールアドレスで再度作成を試みる
      const response = await request.post(USER_API_BASE_URL, { data: newUser });

      // 409 Conflict または 500 Database エラーが返されることを期待
      expect([409, 500]).toContain(response.status());

      const responseData = await response.json();
      expect(responseData.success).toBe(false);

      // エラーコードが環境によって異なる場合に対応
      if (response.status() === 409) {
        expect(responseData.error).toHaveProperty('code', 'CONFLICT_ERROR');
        expect(responseData.error.message).toContain('Unique constraint violation');
      } else {
        expect(responseData.error).toHaveProperty('code', 'DATABASE_ERROR');
        expect(responseData.error.message).toContain('Failed to save user data');
      }

      // テスト後に作成したユーザーを削除
      const firstData = await firstResponse.json();
      if (firstData.data && firstData.data.id) {
        await request.delete(`${USER_API_BASE_URL}/${firstData.data.id}`);
      }
    } else {
      // 最初のユーザー作成に失敗した場合はテストをスキップ
      test.skip(true, '最初のユーザー作成に失敗したためテストをスキップします');
    }
  });

  // テスト用ユーザーが存在することを確認するヘルパー関数
  async function ensureTestUserExists(request: {
    post: (
      url: string,
      options?: { data?: Record<string, unknown>; headers?: Record<string, string> }
    ) => Promise<{
      status: () => number;
      json: () => Promise<{ success: boolean; data: { id: string } }>;
    }>;
    get: (url: string) => Promise<{
      status: () => number;
      json: () => Promise<{ success: boolean; data?: { id: string; name: string; email: string } }>;
    }>;
  }) {
    if (createdUserId) {
      // 既存IDが有効か確認
      const checkResponse = await request.get(`${USER_API_BASE_URL}/${createdUserId}`);
      // IDが無効なら新規作成
      if (checkResponse.status() === 404) {
        createdUserId = null;
      }
    }

    if (!createdUserId) {
      const userData = {
        name: `Test User ${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        passwordPlainText: 'password123',
      };

      const response = await request.post(USER_API_BASE_URL, {
        headers: {
          contentType: 'application/json',
        },
        data: userData,
      });

      if (response.status() === 201) {
        const data = await response.json();
        createdUserId = data.data.id;
        console.log(`📝 テスト用ユーザーを作成しました: ${createdUserId}`);
      }
    }
  }
});
