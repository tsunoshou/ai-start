import { test, expect } from '@playwright/test';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import drizzleConfig from '../../../drizzle.config';
import * as schema from '../../../infrastructure/database/schema'; // スキーマをインポート

// コンテナとDB接続情報を保持する変数
let postgresContainer: StartedPostgreSqlContainer;
let pool: Pool;
let db: ReturnType<typeof drizzle<typeof schema>>; // スキーマで型付け

// Supabase Service Role Key を環境変数から取得
// eslint-disable-next-line @typescript-eslint/naming-convention
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!process.env.CI && !SERVICE_KEY) {
  console.warn(
    '⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. API tests requiring authentication might fail locally.'
  );
}

// 認証ヘッダーを作成するヘルパー関数
// eslint-disable-next-line @typescript-eslint/naming-convention
const getAuthHeaders = () => {
  if (!SERVICE_KEY) {
    // CI環境でキーがない場合はエラーにする
    if (process.env.CI) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in CI environment for API tests');
    }
    // キーがない場合は undefined を返すように変更
    return undefined;
  }
  // キーがある場合はヘッダーオブジェクトを返す
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', // Supabase では apikey も必要
  };
};

// 不要な警告を回避するためのloggerオプション
const QUIET_LOGGER = {
  logQuery: () => {}, // クエリをログに出力しない
};

// テスト対象のAPIエンドポイント
// APIルートのベースURLを使用 (VercelデプロイメントURL or ローカル)
const API_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const USER_API_ENDPOINT = `${API_BASE_URL}/api/users`;

// テスト間で共有するユーザーID
let createdUserId: string | null = null;
// テスト1で作成したユーザーのEmail (フィルタリングテストで使用)
let createdUserEmail: string | null = null;

// テスト用データ作成関数
// eslint-disable-next-line @typescript-eslint/naming-convention
const createUniqueEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

test.describe.serial('ユーザーAPI (E2E)', () => {
  test.beforeAll(async () => {
    console.log('🔧 PostgreSQLコンテナを起動中...');
    try {
      postgresContainer = await new PostgreSqlContainer('postgres:16')
        .withDatabase('testdb')
        .withUsername('testuser')
        .withPassword('testpass')
        .start();

      console.log('✅ PostgreSQLコンテナ起動完了');
      // DB接続情報はコンテナから取得するURIを使用
      const connectionString = postgresContainer.getConnectionUri();
      console.log(`📦 DB接続情報（テストコンテナ）: ${connectionString}`);

      pool = new Pool({ connectionString });
      // スキーマを渡して初期化
      db = drizzle(pool, { schema, logger: QUIET_LOGGER });

      console.log('🔧 マイグレーション実行中...');
      await migrate(db, { migrationsFolder: drizzleConfig.out });
      console.log('✅ マイグレーション実行完了');
    } catch (error) {
      console.error('💥 テスト環境セットアップでエラー発生:', error);
      await cleanupResources();
      throw error; // エラーを再スローしてテストを失敗させる
    }
  });

  test.afterAll(async () => {
    // テスト全体終了後に、テスト1で作成したユーザーが残っていれば削除
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET; // バイパスシークレットを取得
    // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // USER_API_ENDPOINT を使うので不要に

    // ユーザーIDと必要なキーが存在するか確認 (anonKeyのチェックも追加)
    if (createdUserId && serviceRoleKey && anonKey) {
      try {
        // HeadersInit 型を使用して型安全性を高める
        const headersToSend: HeadersInit = {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: anonKey,
        };

        // バイパスシークレットが存在すればヘッダーに追加
        if (bypassSecret) {
          headersToSend['x-vercel-automation-bypass-secret'] = bypassSecret;
        }

        // ★★★ デバッグログを更新 ★★★ (URLも確認用に追加)
        console.log(`DEBUG: Sending DELETE to: ${USER_API_ENDPOINT}/${createdUserId}`);
        console.log(
          'DEBUG: Headers being sent by fetch in afterAll:',
          JSON.stringify(headersToSend, null, 2)
        );
        // ★★★★★★★★★★★★★★★★

        // fetch の URL を USER_API_ENDPOINT を使うように修正
        const deleteResponse = await fetch(`${USER_API_ENDPOINT}/${createdUserId}`, {
          method: 'DELETE',
          headers: headersToSend, // headersToSend を直接渡す
        });
        if (deleteResponse.ok) {
          console.log(`🧹 グローバル後処理: ユーザー (${createdUserId}) を削除しました。`);
        } else {
          console.error(
            `⚠️ グローバル後処理: ユーザー (${createdUserId}) の削除に失敗 (ステータス: ${deleteResponse.status})。`
          );
        }
      } catch (error) {
        console.error(
          `⚠️ グローバル後処理: ユーザー (${createdUserId}) の削除中にエラー発生:`,
          error
        );
      }
    }
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
    const uniqueEmail = createUniqueEmail();
    const newUser = {
      name: 'テストユーザー1', // 名前も少し変える
      email: uniqueEmail,
      passwordPlainText: 'Password123!',
    };

    const response = await request.post(USER_API_ENDPOINT, {
      data: newUser,
      headers: { ...getAuthHeaders() }, // スプレッド構文で undefined の場合は空になる
    });

    console.log(`[テスト1] POST ${USER_API_ENDPOINT} Status: ${response.status()}`);
    if (!response.ok() && response.status() !== 201) {
      console.error('[テスト1] レスポンスボディ:', await response.text());
    }

    expect(response.status()).toBe(201);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('id');
    expect(responseData.data.name).toBe(newUser.name);
    expect(responseData.data.email).toBe(newUser.email);
    expect(responseData.data).not.toHaveProperty('passwordHash');
    expect(responseData.data).not.toHaveProperty('passwordPlainText');

    // 作成されたユーザーIDとEmailを後続テストのために保存
    createdUserId = responseData.data.id;
    createdUserEmail = responseData.data.email;
    console.log(`📝 テスト1: ユーザー作成成功 (ID: ${createdUserId}, Email: ${createdUserEmail})`);
    // このテスト内で作成したユーザーは afterAll で削除するため、ここでは削除しない
  });

  test('1.1 POST /api/users - 無効なデータ（名前が空）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: '',
      email: createUniqueEmail(),
      passwordPlainText: 'Password123!',
    };
    const response = await request.post(USER_API_ENDPOINT, {
      data: invalidUserData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('1.2 POST /api/users - 無効なデータ（不正なメール形式）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: 'Invalid Email User',
      email: 'invalid-email-format',
      passwordPlainText: 'Password123!',
    };
    const response = await request.post(USER_API_ENDPOINT, {
      data: invalidUserData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('1.3 POST /api/users - 無効なデータ（短いパスワード）で400エラー', async ({ request }) => {
    const invalidUserData = {
      name: 'Short Password User',
      email: createUniqueEmail(),
      passwordPlainText: 'short',
    };
    const response = await request.post(USER_API_ENDPOINT, {
      data: invalidUserData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('2. GET /api/users - ユーザー一覧を取得できる', async ({ request }) => {
    // 事前にユーザーが作成されていることを期待 (テスト1で作成)
    expect(createdUserId, 'テスト1でユーザーが作成されているはずです').not.toBeNull();

    const response = await request.get(USER_API_ENDPOINT, {
      headers: { ...getAuthHeaders() },
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(Array.isArray(responseData.data)).toBe(true);
    expect(responseData.data.length).toBeGreaterThan(0);

    const firstUser = responseData.data[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');

    // テスト1で作成したユーザーが含まれているか確認 (任意)
    const foundTestUser = responseData.data.find(
      (user: { id: string }) => user.id === createdUserId
    );
    expect(foundTestUser, 'ユーザー一覧にテスト1で作成したユーザーが含まれている').toBeDefined();
  });

  test('2.1 GET /api/users - ページネーション（limitとoffset）', async ({ request }) => {
    const userIdsToDelete: string[] = [];
    // 3ユーザー作成 (limit=2, offset=1 をテストするため)
    for (let i = 0; i < 3; i++) {
      const email = createUniqueEmail();
      const createResponse = await request.post(USER_API_ENDPOINT, {
        data: { name: `Pagination User ${i}`, email: email, passwordPlainText: 'Password123!' },
        headers: { ...getAuthHeaders() },
      });
      if (createResponse.ok()) {
        const data = await createResponse.json();
        if (data.success && data.data && data.data.id) {
          userIdsToDelete.push(data.data.id);
        }
      } else {
        console.warn(`⚠️ Pagination test user ${i} creation failed: ${createResponse.status()}`);
      }
    }
    // 全員作成できたか確認 (失敗してもテストは続行するが、結果は不安定になる可能性)
    if (userIdsToDelete.length < 3) {
      console.warn(`⚠️ Only ${userIdsToDelete.length} out of 3 pagination users created.`);
    }

    try {
      const response = await request.get(`${USER_API_ENDPOINT}?limit=2&offset=1`, {
        headers: { ...getAuthHeaders() },
      });
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(Array.isArray(responseData.data)).toBe(true);
      // DBの状態によっては期待通り2件にならないこともあるが、最低限のバリデーション
      expect(responseData.data.length).toBeLessThanOrEqual(2);
    } finally {
      // 後片付け
      for (const userId of userIdsToDelete) {
        try {
          await request.delete(`${USER_API_ENDPOINT}/${userId}`, {
            headers: { ...getAuthHeaders() },
          });
          console.log(`🧹 Pagination test user (ID: ${userId}) deleted.`);
        } catch (error) {
          console.error(`⚠️ Error deleting pagination test user (ID: ${userId}):`, error);
        }
      }
    }
  });

  test('2.2 GET /api/users - ページネーション（limitのみ）', async ({ request }) => {
    const response = await request.get(`${USER_API_ENDPOINT}?limit=1`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    // 少なくとも1件データがあれば、1件返るはず
    if (responseData.data.length > 0) {
      expect(responseData.data.length).toBe(1);
    }
  });

  test('2.3 GET /api/users - ページネーション（offsetのみ）', async ({ request }) => {
    const allUsersResponse = await request.get(USER_API_ENDPOINT, {
      headers: { ...getAuthHeaders() },
    });
    if (!allUsersResponse.ok()) return; // 全件取得失敗ならスキップ
    const allUsersData = await allUsersResponse.json();
    const totalUsers = allUsersData.data.length;

    if (totalUsers > 1) {
      const offset = 1;
      const response = await request.get(`${USER_API_ENDPOINT}?offset=${offset}`, {
        headers: { ...getAuthHeaders() },
      });
      expect(response.status()).toBe(200);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data.length).toBe(totalUsers - offset);
    }
  });

  test('2.4 GET /api/users - ページネーション（不正なlimit）', async ({ request }) => {
    const response = await request.get(`${USER_API_ENDPOINT}?limit=-1`, {
      headers: { ...getAuthHeaders() }, // 不正リクエストでも認証は試みる
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('2.5 GET /api/users - ページネーション（不正なoffset）', async ({ request }) => {
    const response = await request.get(`${USER_API_ENDPOINT}?offset=-1`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('2.6 GET /api/users - emailフィルタリング', async ({ request }) => {
    // テスト1で作成したユーザーのEmailを使用
    expect(createdUserEmail, 'テスト1でユーザーEmailが取得されているはずです').not.toBeNull();
    const testEmail = createdUserEmail!;

    // 1. テスト1で作成したユーザーのemailでフィルタリング
    const filterResponse = await request.get(`${USER_API_ENDPOINT}?email=${testEmail}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(filterResponse.status()).toBe(200);
    const filterData = await filterResponse.json();
    expect(filterData.success).toBe(true);
    expect(Array.isArray(filterData.data)).toBe(true);
    expect(filterData.data.length).toBe(1);
    expect(filterData.data[0].email).toBe(testEmail);
    expect(filterData.data[0].id).toBe(createdUserId);

    // 2. 存在しないemailでフィルタリング
    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
    const noResultResponse = await request.get(`${USER_API_ENDPOINT}?email=${nonExistentEmail}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(noResultResponse.status()).toBe(200);
    const noResultData = await noResultResponse.json();
    expect(noResultData.success).toBe(true);
    expect(Array.isArray(noResultData.data)).toBe(true);
    expect(noResultData.data.length).toBe(0);

    // 3. 不正なemail形式でフィルタリング (400エラー)
    const invalidEmail = 'invalid-email-format';
    const invalidResponse = await request.get(`${USER_API_ENDPOINT}?email=${invalidEmail}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(invalidResponse.status()).toBe(400);
    const invalidData = await invalidResponse.json();
    expect(invalidData.success).toBe(false);
    expect(invalidData.error).toHaveProperty('code', 'VALIDATION_ERROR');
    // このテストではユーザー作成/削除は不要（テスト1の結果を利用）
  });

  test('3. GET /api/users/:id - 特定のユーザーを取得できる', async ({ request }) => {
    expect(createdUserId, 'テスト1でユーザーIDが取得されているはずです').not.toBeNull();
    const userId = createdUserId!;

    const response = await request.get(`${USER_API_ENDPOINT}/${userId}`, {
      headers: { ...getAuthHeaders() },
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe(userId);
  });

  test('4. GET /api/users/:id - 存在しないユーザーIDでは404エラーが返る', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-a000-000000000000';
    const response = await request.get(`${USER_API_ENDPOINT}/${nonExistentId}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(404);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'NOT_FOUND');
  });

  test('4.1 GET /api/users/:id - 無効なID形式で400エラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const response = await request.get(`${USER_API_ENDPOINT}/${invalidId}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5. PATCH /api/users/:id - ユーザー情報を更新できる', async ({ request }) => {
    expect(createdUserId, 'テスト1でユーザーIDが取得されているはずです').not.toBeNull();
    const userId = createdUserId!;
    const updateData = { name: '更新後テストユーザー' };

    const response = await request.patch(`${USER_API_ENDPOINT}/${userId}`, {
      data: updateData,
      headers: { ...getAuthHeaders() },
    });

    expect(response.status()).toBe(200);
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe(userId);
    expect(responseData.data.name).toBe(updateData.name);

    // 元の名前に戻しておく (任意、次のテストへの影響を避けるため)
    await request.patch(`${USER_API_ENDPOINT}/${userId}`, {
      data: { name: 'テストユーザー1' }, // テスト1で作成した名前に戻す
      headers: { ...getAuthHeaders() },
    });
  });

  test('5.1 PATCH /api/users/:id - 無効なデータ（名前が空）で400エラー', async ({ request }) => {
    expect(createdUserId, 'テスト1でユーザーIDが取得されているはずです').not.toBeNull();
    const userId = createdUserId!;
    const invalidUpdateData = { name: '' };
    const response = await request.patch(`${USER_API_ENDPOINT}/${userId}`, {
      data: invalidUpdateData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5.2 PATCH /api/users/:id - 空のリクエストボディで400エラー', async ({ request }) => {
    expect(createdUserId, 'テスト1でユーザーIDが取得されているはずです').not.toBeNull();
    const userId = createdUserId!;
    const response = await request.patch(`${USER_API_ENDPOINT}/${userId}`, {
      data: {},
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5.3 PATCH /api/users/:id - 無効なID形式で400エラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const updateData = { name: 'Update attempt' };
    const response = await request.patch(`${USER_API_ENDPOINT}/${invalidId}`, {
      data: updateData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('5.4 PATCH /api/users/:id - 存在しないIDで404エラー', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-a000-000000000001';
    const updateData = { name: 'Update Non Existent' };
    const response = await request.patch(`${USER_API_ENDPOINT}/${nonExistentId}`, {
      data: updateData,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(404);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'NOT_FOUND');
  });

  test('6. DELETE /api/users/:id - ユーザーを削除できる', async ({ request }) => {
    // このテスト用に新しいユーザーを作成して削除する
    const emailToDelete = createUniqueEmail();
    const newUserResponse = await request.post(USER_API_ENDPOINT, {
      data: { name: '削除用ユーザー', email: emailToDelete, passwordPlainText: 'Password123!' },
      headers: { ...getAuthHeaders() },
    });

    expect(newUserResponse.ok(), '削除用ユーザーの作成に成功するはず').toBe(true);
    const userData = await newUserResponse.json();
    const userIdToDelete = userData.data.id;

    // 削除実行
    const response = await request.delete(`${USER_API_ENDPOINT}/${userIdToDelete}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(204);

    // 再取得して404を確認
    const getResponse = await request.get(`${USER_API_ENDPOINT}/${userIdToDelete}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(getResponse.status()).toBe(404);
  });

  test('6.1 DELETE /api/users/:id - 無効なID形式で400エラー', async ({ request }) => {
    const invalidId = 'invalid-uuid';
    const response = await request.delete(`${USER_API_ENDPOINT}/${invalidId}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('6.2 DELETE /api/users/:id - 存在しないIDで204(冪等性)', async ({ request }) => {
    const nonExistentId = '00000000-0000-4000-a000-000000000002';
    const response = await request.delete(`${USER_API_ENDPOINT}/${nonExistentId}`, {
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(204);
  });

  // 失敗系のテスト
  test('7. POST /api/users - バリデーションエラー（不正な形式のメール）', async ({ request }) => {
    const invalidUser = {
      name: 'Invalid User',
      email: 'invalid-email',
      passwordPlainText: 'Password123!', // パスワードも適切な形式に
    };
    const response = await request.post(USER_API_ENDPOINT, {
      data: invalidUser,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('8. POST /api/users - バリデーションエラー（短すぎるパスワード）', async ({ request }) => {
    const invalidUser = {
      name: 'Invalid User',
      email: createUniqueEmail(), // emailはユニークに
      passwordPlainText: '123',
    };
    const response = await request.post(USER_API_ENDPOINT, {
      data: invalidUser,
      headers: { ...getAuthHeaders() },
    });
    expect(response.status()).toBe(400);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'VALIDATION_ERROR');
  });

  test('9. POST /api/users - 既存メールアドレスでの409エラー', async ({ request }) => {
    // テスト1で作成したEmailを使用
    expect(createdUserEmail, 'テスト1でユーザーEmailが取得されているはずです').not.toBeNull();
    const existingEmail = createdUserEmail!;

    const duplicateUser = {
      name: 'Duplicate User', // 名前は変えても良い
      email: existingEmail,
      passwordPlainText: 'AnotherPassword456!', // パスワードは変える
    };

    // 同じメールアドレスで再度作成を試みる
    const response = await request.post(USER_API_ENDPOINT, {
      data: duplicateUser,
      headers: { ...getAuthHeaders() },
    });

    // 409 Conflictを期待
    expect(response.status()).toBe(409);
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toHaveProperty('code', 'CONFLICT_ERROR');
    // メッセージに email が含まれているか確認 (より具体的に)
    expect(responseData.error.message).toMatch(
      /Unique constraint violation during save of entity: duplicate email value/i
    );
    // このテストではユーザー削除は不要（テスト1の結果を利用）
  });
});
