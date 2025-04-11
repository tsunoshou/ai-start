/**
 * UserRepository 統合テスト
 * テストコンテナを使用して PostgreSQL に接続し、実際のデータベース操作をテストします
 */

import 'reflect-metadata'; // tsyringe で必要

import { fail } from 'node:assert';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { GenericContainer, type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserId } from '@core/user/domain/value-objects/user-id.vo.ts';
import { UserName } from '@core/user/domain/value-objects/user-name.vo.ts';
import { User } from '@core/user/domain/entities/user.entity.ts';
import { UserRepository } from '@core/user/infrastructure/repositories/user.repository.ts';
import { users } from '@core/shared/infrastructure/database/schema/index.ts';
import { UserMapper } from '@core/user/infrastructure/mappers/user.mapper.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo.ts';
import { Email } from '@core/shared/value-objects/email.vo.ts';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo.ts';

// 型エラーを回避するための eslint-disable
/* eslint-disable @typescript-eslint/no-explicit-any */

describe('UserRepository 統合テスト', () => {
  let container: StartedTestContainer;
  let pool: Pool;
  let db: any; // テストのための簡易的な型定義
  let userRepository: UserRepository;
  let userMapper: UserMapper;
  let mockLogger: LoggerInterface;

  beforeAll(async () => {
    console.log('PostgreSQL コンテナを開始しています...');
    // PostgreSQL コンテナを起動
    container = await new GenericContainer('postgres:16')
      /* eslint-disable @typescript-eslint/naming-convention */
      .withEnvironment({
        POSTGRES_USER: 'testuser',
        POSTGRES_PASSWORD: 'testpassword',
        POSTGRES_DB: 'testdb',
      })
      /* eslint-enable @typescript-eslint/naming-convention */
      .withExposedPorts(5432)
      .start();

    // DB接続文字列を構築
    const connectionString = `postgresql://testuser:testpassword@${container.getHost()}:${container.getMappedPort(5432)}/testdb`;
    console.log(
      `データベースに接続しています: ${connectionString.replace('testpassword', '********')} ...`
    );

    // 接続プールを作成
    pool = new Pool({ connectionString });

    // Drizzle インスタンスを初期化
    db = drizzle(pool);
    console.log('データベース接続プールを作成しました。');

    // マイグレーションを適用
    console.log('データベースマイグレーションを適用しています...');
    try {
      await migrate(db, { migrationsFolder: 'infrastructure/database/migrations' });
      console.log('マイグレーションが正常に適用されました。');
    } catch (error) {
      console.error('マイグレーション失敗:', error);
      throw error;
    }

    // モックロガーを作成
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    };

    // UserMapperとUserRepositoryを初期化
    console.log('UserRepository を初期化しています...');
    userMapper = new UserMapper();
    userRepository = new UserRepository(db, mockLogger, userMapper);
    console.log('UserRepository が初期化されました。');
  }, 180000); // 3分のタイムアウト

  afterAll(async () => {
    console.log('PostgreSQL コンテナを停止し、プールを閉じています...');
    await pool?.end();
    await container?.stop();
    console.log('PostgreSQL コンテナが停止しました。');
  }, 60000);

  beforeEach(async () => {
    // 各テスト前にユーザーテーブルをクリーンアップ
    await db.delete(users);

    // モックロガーをリセット
    vi.clearAllMocks();
  });

  it('新しいユーザーを保存し、IDで検索できる', async () => {
    // 準備: ユーザーID作成
    const userIdResult = UserId.generate();
    if (userIdResult.isErr()) fail(`UserId の生成に失敗しました: ${userIdResult.error.message}`);
    const userId = userIdResult.value;

    // 値オブジェクト作成 - エラー時にメッセージを表示
    const userNameResult = UserName.create('テストユーザー');
    if (userNameResult.isErr()) {
      console.error('UserName エラー詳細:', userNameResult.error);
      fail(`UserName の作成に失敗しました: ${userNameResult.error.message}`);
    }
    const userName = userNameResult.value;

    const emailResult = Email.create('test.user@example.com');
    if (emailResult.isErr()) {
      console.error('Email エラー詳細:', emailResult.error);
      fail(`Email の作成に失敗しました: ${emailResult.error.message}`);
    }
    const email = emailResult.value;

    const passwordHashResult = PasswordHash.create('validhashedpassword');
    if (passwordHashResult.isErr()) {
      console.error('PasswordHash エラー詳細:', passwordHashResult.error);
      fail(`PasswordHash の作成に失敗しました: ${passwordHashResult.error.message}`);
    }
    const passwordHash = passwordHashResult.value;

    // ユーザー作成 (create + reconstruct で特定IDを持つユーザーを作成)
    const userResult = User.create({ name: userName, email, passwordHash });
    if (userResult.isErr()) {
      console.error('User エラー詳細:', userResult.error);
      fail(`User の作成に失敗しました: ${userResult.error.message}`);
    }
    const user = userResult.value;

    // 指定したIDでユーザーを再構築
    const now = DateTimeString.now();
    const userWithId = User.reconstruct({
      id: userId,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    // 実行
    await userRepository.save(userWithId);
    const foundUserResult = await userRepository.findById(userId);

    // 検証
    expect(foundUserResult.isOk()).toBe(true);
    const foundUser = foundUserResult.unwrapOr(null);
    expect(foundUser).not.toBeNull();

    if (foundUser) {
      expect(foundUser.id.equals(userId)).toBe(true);
      expect(foundUser.name.value).toBe(userName.value);
      expect(foundUser.email.value).toBe(email.value);
      expect(foundUser.passwordHash.value).toBe(passwordHash.value);
      // DateTimeString型に変更
      expect(foundUser.createdAt).toBeInstanceOf(DateTimeString);
      expect(foundUser.updatedAt).toBeInstanceOf(DateTimeString);
    }
  });

  it('存在しないIDで検索すると null を返す', async () => {
    // 準備: 存在しないであろうランダムなUUIDを生成
    const nonExistentUserIdResult = UserId.generate();
    if (nonExistentUserIdResult.isErr()) {
      fail(`UserId の生成に失敗しました: ${nonExistentUserIdResult.error.message}`);
    }
    const nonExistentUserId = nonExistentUserIdResult.value;

    // 実行
    const foundResult = await userRepository.findById(nonExistentUserId);

    // 検証
    expect(foundResult.isOk()).toBe(true);
    expect(foundResult.unwrapOr(null)).toBeNull(); // 結果が null であることを確認
  });

  it('既存のユーザーをメールアドレスで検索できる', async () => {
    // 準備: 値オブジェクトとユーザー作成
    const userIdResult = UserId.generate();
    if (userIdResult.isErr()) fail(`UserId の生成に失敗しました: ${userIdResult.error.message}`);
    const userId = userIdResult.value;

    // 値オブジェクト作成 - エラー時にメッセージを表示
    const userNameResult = UserName.create('メールユーザー');
    if (userNameResult.isErr()) {
      console.error('UserName エラー詳細:', userNameResult.error);
      fail(`UserName の作成に失敗しました: ${userNameResult.error.message}`);
    }
    const userName = userNameResult.value;

    const emailResult = Email.create('find.me@example.com');
    if (emailResult.isErr()) {
      console.error('Email エラー詳細:', emailResult.error);
      fail(`Email の作成に失敗しました: ${emailResult.error.message}`);
    }
    const email = emailResult.value;

    const passwordHashResult = PasswordHash.create('anotherhash');
    if (passwordHashResult.isErr()) {
      console.error('PasswordHash エラー詳細:', passwordHashResult.error);
      fail(`PasswordHash の作成に失敗しました: ${passwordHashResult.error.message}`);
    }
    const passwordHash = passwordHashResult.value;

    // create でユーザー作成後、reconstruct で特定IDを持つユーザーに変換
    const userResult = User.create({ name: userName, email, passwordHash });
    if (userResult.isErr()) {
      console.error('User エラー詳細:', userResult.error);
      fail(`User の作成に失敗しました: ${userResult.error.message}`);
    }
    const user = userResult.value;

    const now = DateTimeString.now();
    const userWithId = User.reconstruct({
      id: userId,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await userRepository.save(userWithId);

    // 実行
    const foundResult = await userRepository.findByEmail(email);

    // 検証
    expect(foundResult.isOk()).toBe(true);
    const foundUser = foundResult.unwrapOr(null);
    expect(foundUser).not.toBeNull();

    if (foundUser) {
      expect(foundUser.id.equals(userId)).toBe(true);
      expect(foundUser.email.equals(email)).toBe(true);
    }
  });

  it('存在しないメールアドレスで検索すると null を返す', async () => {
    // 準備: 存在しないであろうメールアドレス
    const nonExistentEmailResult = Email.create('not.found@example.com');
    if (nonExistentEmailResult.isErr()) {
      fail(`Email の作成に失敗しました: ${nonExistentEmailResult.error.message}`);
    }
    const nonExistentEmail = nonExistentEmailResult.value;

    // 実行
    const foundResult = await userRepository.findByEmail(nonExistentEmail);

    // 検証
    expect(foundResult.isOk()).toBe(true);
    expect(foundResult.unwrapOr(null)).toBeNull();
  });

  it('ユーザーを削除できる', async () => {
    // 準備: 値オブジェクトとユーザー作成
    const userIdResult = UserId.generate();
    if (userIdResult.isErr()) fail(`UserId の生成に失敗しました: ${userIdResult.error.message}`);
    const userId = userIdResult.value;

    // 値オブジェクト作成 - エラー時にメッセージを表示
    const userNameResult = UserName.create('削除ユーザー');
    if (userNameResult.isErr()) {
      console.error('UserName エラー詳細:', userNameResult.error);
      fail(`UserName の作成に失敗しました: ${userNameResult.error.message}`);
    }
    const userName = userNameResult.value;

    const emailResult = Email.create('delete.me@example.com');
    if (emailResult.isErr()) {
      console.error('Email エラー詳細:', emailResult.error);
      fail(`Email の作成に失敗しました: ${emailResult.error.message}`);
    }
    const email = emailResult.value;

    const passwordHashResult = PasswordHash.create('deletehash');
    if (passwordHashResult.isErr()) {
      console.error('PasswordHash エラー詳細:', passwordHashResult.error);
      fail(`PasswordHash の作成に失敗しました: ${passwordHashResult.error.message}`);
    }
    const passwordHash = passwordHashResult.value;

    // create でユーザー作成後、reconstruct で特定IDを持つユーザーに変換
    const userResult = User.create({ name: userName, email, passwordHash });
    if (userResult.isErr()) {
      console.error('User エラー詳細:', userResult.error);
      fail(`User の作成に失敗しました: ${userResult.error.message}`);
    }
    const user = userResult.value;

    const now = DateTimeString.now();
    const userWithId = User.reconstruct({
      id: userId,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    await userRepository.save(userWithId);

    // 事前確認: ユーザーが保存されていることを確認
    const beforeDeleteResult = await userRepository.findById(userId);
    expect(beforeDeleteResult.unwrapOr(null)).not.toBeNull();

    // 実行
    const deleteResult = await userRepository.delete(userId);

    // 検証
    expect(deleteResult.isOk()).toBe(true);

    // 削除後に検索してnullが返ることを確認
    const afterDeleteResult = await userRepository.findById(userId);
    expect(afterDeleteResult.unwrapOr(null)).toBeNull();
  });

  it('複数ユーザーを検索できる (findAll)', async () => {
    // 準備: 複数のユーザーを作成
    // 削除: const createdUsers = [];

    // テストデータ作成
    const usersData = [
      {
        name: UserName.create('Test User 0')._unsafeUnwrap(),
        email: Email.create('test0@example.com')._unsafeUnwrap(),
        // 8文字以上の有効なハッシュ文字列を使用
        passwordHash: PasswordHash.create('validhash0')._unsafeUnwrap(),
      },
      {
        name: UserName.create('Test User 1')._unsafeUnwrap(),
        email: Email.create('test1@example.com')._unsafeUnwrap(),
        // 8文字以上の有効なハッシュ文字列を使用
        passwordHash: PasswordHash.create('validhash1')._unsafeUnwrap(),
      },
      {
        name: UserName.create('Test User 2')._unsafeUnwrap(),
        email: Email.create('test2@example.com')._unsafeUnwrap(),
        // 8文字以上の有効なハッシュ文字列を使用
        passwordHash: PasswordHash.create('validhash2')._unsafeUnwrap(),
      },
    ];

    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      const userResult = User.create(userData);
      if (userResult.isErr()) {
        fail(`User ${i} の作成に失敗しました: ${userResult.error.message}`);
      }
      const user = userResult.value;
      await userRepository.save(user);
    }

    // 実行
    const allUsersResult = await userRepository.findAll();
    const limitedUsersResult = await userRepository.findAll({ limit: 3 });
    const offsetUsersResult = await userRepository.findAll({ offset: 2 });
    const paginatedUsersResult = await userRepository.findAll({ limit: 2, offset: 2 });

    // 検証
    expect(allUsersResult.isOk()).toBe(true);
    expect(limitedUsersResult.isOk()).toBe(true);
    expect(offsetUsersResult.isOk()).toBe(true);
    expect(paginatedUsersResult.isOk()).toBe(true);

    const allUsers = allUsersResult.unwrapOr([]);
    const limitedUsers = limitedUsersResult.unwrapOr([]);
    const offsetUsers = offsetUsersResult.unwrapOr([]);
    const paginatedUsers = paginatedUsersResult.unwrapOr([]);

    expect(allUsers.length).toBe(3);
    expect(limitedUsers.length).toBe(3);
    expect(offsetUsers.length).toBe(1);
    expect(paginatedUsers.length).toBe(1);
  });

  it('ユーザー情報を更新できる', async () => {
    // 準備: 初期ユーザー作成
    const initialEmail = Email.create('update.initial@example.com')._unsafeUnwrap();
    const initialName = UserName.create('Initial User')._unsafeUnwrap();
    const initialHash = PasswordHash.create('initialHash123')._unsafeUnwrap();
    const userResult = User.create({
      email: initialEmail,
      name: initialName,
      passwordHash: initialHash,
    });
    if (userResult.isErr()) fail('初期ユーザー作成失敗');
    const initialUser = userResult.value;
    await userRepository.save(initialUser);

    // 準備: 更新後のデータ
    const updatedName = UserName.create('Updated User Name')._unsafeUnwrap();
    const updatedEmail = Email.create('update.final@example.com')._unsafeUnwrap(); // Emailも更新してみる

    // 実行: ユーザー情報を更新 (reconstruct を使用して更新されたエンティティを作成)
    // 注意: DBから取得せずに更新する場合、createdAt は元の値を維持、updatedAtは更新する必要がある
    // DBから取得する方がより現実的だが、ここでは reconstruct でシミュレート
    const userToUpdate = User.reconstruct({
      id: initialUser.id,
      email: updatedEmail, // Emailを更新
      name: updatedName, // 名前を更新
      passwordHash: initialUser.passwordHash, // パスワードは変更しない
      createdAt: initialUser.createdAt,
      updatedAt: DateTimeString.now(), // updatedAtを更新
    });

    const saveResult = await userRepository.save(userToUpdate);
    expect(saveResult.isOk()).toBe(true);

    // 検証: 更新されたユーザーを ID で再取得
    const foundAfterUpdateResult = await userRepository.findById(initialUser.id);
    expect(foundAfterUpdateResult.isOk()).toBe(true);
    const foundUser = foundAfterUpdateResult.unwrapOr(null);

    expect(foundUser).not.toBeNull();
    if (foundUser) {
      expect(foundUser.id.equals(initialUser.id)).toBe(true);
      expect(foundUser.name.equals(updatedName)).toBe(true); // 名前が更新されている
      expect(foundUser.email.equals(updatedEmail)).toBe(true); // Emailが更新されている
      expect(foundUser.passwordHash.equals(initialHash)).toBe(true); // パスワードは同じ
      expect(foundUser.createdAt.equals(initialUser.createdAt)).toBe(true); // createdAt は変わらない
      // updatedAt は更新されているはずだが、ミリ秒単位での完全一致は難しいため、型と存在を確認
      expect(foundUser.updatedAt).toBeInstanceOf(DateTimeString);
      // 更新時刻が作成時刻より後であることを確認 (より厳密なテスト)
      expect(new Date(foundUser.updatedAt.value) >= new Date(foundUser.createdAt.value)).toBe(true);
    }
  });

  it('ユーザーを削除できる', async () => {
    // 準備: 削除対象ユーザー作成
    const email = Email.create('delete.me@example.com')._unsafeUnwrap();
    const name = UserName.create('Delete User')._unsafeUnwrap();
    const hash = PasswordHash.create('deleteHash123')._unsafeUnwrap();
    const userResult = User.create({ email, name, passwordHash: hash });
    if (userResult.isErr()) fail('削除対象ユーザー作成失敗');
    const userToDelete = userResult.value;
    await userRepository.save(userToDelete);

    // 実行: ユーザーを削除
    const deleteResult = await userRepository.delete(userToDelete.id);

    // 検証: 削除が成功したか
    expect(deleteResult.isOk()).toBe(true);

    // 検証: 削除されたユーザーを検索してnullが返るか
    const findResult = await userRepository.findById(userToDelete.id);
    expect(findResult.isOk()).toBe(true);
    expect(findResult.unwrapOr(null)).toBeNull();
  });

  it('存在しないユーザーを削除しようとしてもエラーにならない', async () => {
    // 準備: 存在しないランダムなID
    const nonExistentUserId = UserId.generate()._unsafeUnwrap();

    // 実行: 存在しないユーザーを削除
    const deleteResult = await userRepository.delete(nonExistentUserId);

    // 検証: エラーなく完了する（okが返る）
    expect(deleteResult.isOk()).toBe(true);
  });

  // --- findAll tests --- //

  // 複数のユーザーを作成するヘルパー関数
  const createMultipleUsers = async (count: number): Promise<User[]> => {
    const _createdUsers: User[] = [];
    for (let i = 0; i < count; i++) {
      const uniqueEmail = Email.create(`user${i}@example.com`)._unsafeUnwrap();
      const name = UserName.create(`User ${i}`)._unsafeUnwrap();
      const hash = PasswordHash.create(`passwordHash${i}`)._unsafeUnwrap();
      const userResult = User.create({ email: uniqueEmail, name, passwordHash: hash });
      if (userResult.isErr()) fail(`テストユーザー作成失敗: ${userResult.error.message}`);
      const user = userResult.value;
      // reconstruct を使って createdAt, updatedAt を設定
      const now = DateTimeString.now();
      const userWithDates = User.reconstruct({
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
        createdAt: now,
        updatedAt: now,
      });
      await userRepository.save(userWithDates);
      _createdUsers.push(userWithDates);
    }
    return _createdUsers;
  };

  it('すべてのユーザーをページネーションなしで取得できること', async () => {
    // Arrange: 5人のユーザーを作成
    await createMultipleUsers(5);

    // Act: ページネーションなしで全ユーザーを取得
    const result = await userRepository.findAll({
      // No pagination parameters needed for this test
    });

    // Assert: 取得したユーザーの数が正しいか
    expect(result.isOk()).toBe(true);
    const allUsers = result.unwrapOr([]);
    expect(allUsers.length).toBe(5);
  });
});
