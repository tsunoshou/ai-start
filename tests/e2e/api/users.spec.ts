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

// ユーザーデータの型定義
interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

test.describe.serial('ユーザーAPI (E2E)', () => {
  let createdUserId: string; // テスト間で共有するユーザーID

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

  test('1. POST /api/users - 新規ユーザーを作成できる', async ({ request }) => {
    // テスト用ユーザーデータ
    const newUser = {
      name: 'テストユーザー',
      email: 'test@example.com',
      passwordPlainText: 'Password123!',
    };

    // APIリクエスト実行
    const response = await request.post(USER_API_BASE_URL, {
      data: newUser,
    });

    // レスポンスの検証
    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('id');
    expect(responseData.data.name).toBe(newUser.name);
    expect(responseData.data.email).toBe(newUser.email);

    // パスワード関連の情報がレスポンスに含まれていないことを確認
    expect(responseData.data).not.toHaveProperty('passwordHash');
    expect(responseData.data).not.toHaveProperty('passwordPlainText');

    // 次のテストで使用するためにIDを保存
    createdUserId = responseData.data.id;
  });

  test('2. GET /api/users - ユーザー一覧を取得できる', async ({ request }) => {
    const response = await request.get(USER_API_BASE_URL);

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);

    // 作成したユーザーが一覧に含まれているか確認
    const users = responseData.data;
    const createdUser = users.find((user: UserData) => user.id === createdUserId);
    expect(createdUser).toBeDefined();
    expect(createdUser.name).toBe('テストユーザー');
  });

  test('3. GET /api/users/:id - 特定のユーザーを取得できる', async ({ request }) => {
    const response = await request.get(`${USER_API_BASE_URL}/${createdUserId}`);

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe(createdUserId);
    expect(responseData.data.name).toBe('テストユーザー');
    expect(responseData.data.email).toBe('test@example.com');
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
    expect(responseData.data.email).toBe('test@example.com'); // 更新していない項目は維持される
  });

  test('6. DELETE /api/users/:id - ユーザーを削除できる', async ({ request }) => {
    const response = await request.delete(`${USER_API_BASE_URL}/${createdUserId}`);

    // 成功時は204 No Content
    expect(response.status()).toBe(204);

    // 削除後に再度取得を試みて404エラーになることを確認
    const getResponse = await request.get(`${USER_API_BASE_URL}/${createdUserId}`);
    expect(getResponse.status()).toBe(404);
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
    // 最初に正常にユーザーを作成
    const newUser = {
      name: 'Duplicate Email User',
      email: 'duplicate@example.com',
      passwordPlainText: 'Password123!',
    };

    await request.post(USER_API_BASE_URL, { data: newUser });

    // 同じメールアドレスで再度作成を試みる
    const response = await request.post(USER_API_BASE_URL, { data: newUser });

    // 409 Conflict エラーが返されることを期待
    expect(response.status()).toBe(409);

    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'CONFLICT');
    expect(responseData.error.message).toContain('already in use');
  });
});
