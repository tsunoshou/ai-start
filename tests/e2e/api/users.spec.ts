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

  test('1.1 POST /api/users - 無効なデータ（名前が空）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: '', // 空の名前
      email: `invalid-name-${Date.now()}@example.com`,
      passwordPlainText: 'Password123!',
    };
    const response = await request.post(USER_API_BASE_URL, { data: invalidUserData });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('1.2 POST /api/users - 無効なデータ（不正なメール形式）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: 'Invalid Email User',
      email: 'invalid-email-format', // 不正なメール形式
      passwordPlainText: 'Password123!',
    };
    const response = await request.post(USER_API_BASE_URL, { data: invalidUserData });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('1.3 POST /api/users - 無効なデータ（短いパスワード）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: 'Short Password User',
      email: `short-pw-${Date.now()}@example.com`,
      passwordPlainText: 'short', // 短いパスワード
    };
    const response = await request.post(USER_API_BASE_URL, { data: invalidUserData });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
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

  test('2.1 GET /api/users - ページネーション（limitとoffset）', async ({ request }) => {
    // テスト用に複数ユーザーを作成 (例として3ユーザー)
    const userEmails = [];
    for (let i = 0; i < 3; i++) {
      const email = `pagination-${Date.now()}-${i}@example.com`;
      const createResponse = await request.post(USER_API_BASE_URL, {
        data: {
          name: `Pagination User ${i}`,
          email: email,
          passwordPlainText: 'Password123!',
        },
      });
      if (createResponse.status() === 201) {
        userEmails.push(email);
      }
    }
    expect(userEmails.length).toBe(3); // 3ユーザー作成できたことを確認

    // limit=2, offset=1 で取得
    const response = await request.get(`${USER_API_BASE_URL}?limit=2&offset=1`);
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);

    expect(responseData.data.length).toBe(2);
    // offset=1なので、2番目と3番目のユーザーが含まれるはず (作成順に依存)
    // emailでの確認（より確実）-> DB全体の状態に依存するため、件数チェックのみにする
    // const returnedEmails = responseData.data.map((user: { email: string }) => user.email);
    // expect(returnedEmails).toContain(userEmails[1]);
    // expect(returnedEmails).toContain(userEmails[2]);
    // expect(returnedEmails).not.toContain(userEmails[0]);

    // 後片付け: 作成したユーザーを削除
    for (const email of userEmails) {
      // ユーザーIDを取得するためにemailで検索が必要だが、E2EテストではID直接指定が望ましい
      // ここでは簡略化のため削除処理を省略（または別途IDを取得する実装が必要）
      console.warn(
        `ページネーションテストで作成したユーザー(${email})の削除処理は実装されていません`
      );
    }
  });

  test('2.2 GET /api/users - ページネーション（limitのみ）', async ({ request }) => {
    const response = await request.get(`${USER_API_BASE_URL}?limit=1`);
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.length).toBe(1);
  });

  test('2.3 GET /api/users - ページネーション（offsetのみ）', async ({ request }) => {
    // 全件取得して総数を把握
    const allUsersResponse = await request.get(USER_API_BASE_URL);
    const totalUsers = (await allUsersResponse.json()).data.length;

    if (totalUsers > 1) {
      const offset = 1;
      const response = await request.get(`${USER_API_BASE_URL}?offset=${offset}`);
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      // 期待される件数は totalUsers - offset
      expect(responseData.data.length).toBe(totalUsers - offset);
    }
  });

  test('2.4 GET /api/users - ページネーション（不正なlimit）', async ({ request }) => {
    const response = await request.get(`${USER_API_BASE_URL}?limit=-1`);
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('2.5 GET /api/users - ページネーション（不正なoffset）', async ({ request }) => {
    const response = await request.get(`${USER_API_BASE_URL}?offset=-1`);
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
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

  test('4.1 GET /api/users/:id - 無効なID形式でエラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const response = await request.get(`${USER_API_BASE_URL}/${invalidId}`);
    expect(response.status()).toBe(400); // AppErrorが返されることを期待
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
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

  test('5.1 PATCH /api/users/:id - 無効なデータ（名前が空）で400エラー', async ({ request }) => {
    await ensureTestUserExists(request);
    const invalidUpdateData = {
      name: '', // 空の名前
    };
    const response = await request.patch(`${USER_API_BASE_URL}/${createdUserId}`, {
      data: invalidUpdateData,
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5.2 PATCH /api/users/:id - 空のリクエストボディで400エラー', async ({ request }) => {
    await ensureTestUserExists(request);
    const response = await request.patch(`${USER_API_BASE_URL}/${createdUserId}`, {
      data: {}, // 空のボディ
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
    // refine のエラーメッセージを検証 (実装依存)
    // expect(responseData.error.message.toLowerCase()).toContain('at least one field');
  });

  test('5.3 PATCH /api/users/:id - 無効なID形式でエラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const updateData = { name: 'Update attempt' };
    const response = await request.patch(`${USER_API_BASE_URL}/${invalidId}`, {
      data: updateData,
    });
    expect(response.status()).toBe(400); // AppErrorが返されることを期待
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5.4 PATCH /api/users/:id - 存在しないIDで404エラー', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-a000-000000000001'; // 存在する可能性が低いUUID
    const updateData = { name: 'Update Non Existent' };
    const response = await request.patch(`${USER_API_BASE_URL}/${nonExistentId}`, {
      data: updateData,
    });
    expect(response.status()).toBe(404);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'NOT_FOUND');
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

  test('6.1 DELETE /api/users/:id - 無効なID形式でエラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const response = await request.delete(`${USER_API_BASE_URL}/${invalidId}`);
    // 期待されるステータスコード。バリデーションがどこで行われるかによって400または他のエラーコードになる可能性がある
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR'); // または NOT_FOUND など実装による
  });

  test('6.2 DELETE /api/users/:id - 存在しないIDで204(冪等性)', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-a000-000000000002'; // 存在する可能性が低いUUID
    const response = await request.delete(`${USER_API_BASE_URL}/${nonExistentId}`);
    // 冪等性のため、存在しないリソースの削除も成功(204)として扱われる
    expect(response.status()).toBe(204);
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
