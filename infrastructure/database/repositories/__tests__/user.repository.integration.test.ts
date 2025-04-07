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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserId } from '@/domain/models/user/user-id.vo';
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepository } from '@/infrastructure/database/repositories/user.repository';
import { users } from '@/infrastructure/database/schema';
import { UserMapper } from '@/infrastructure/mappers/user.mapper';
import { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

// 型エラーを回避するための eslint-disable
/* eslint-disable @typescript-eslint/no-explicit-any */

describe('UserRepository 統合テスト', () => {
  let container: StartedTestContainer;
  let pool: Pool;
  let db: any; // テストのための簡易的な型定義
  let userRepository: UserRepository;

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

    // UserRepository を初期化
    console.log('UserRepository を初期化しています...');
    const userMapper = new UserMapper();
    userRepository = new UserRepository(db, userMapper);
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
    // 準備
    const emailResult = Email.create('nobody@example.com');
    if (emailResult.isErr()) {
      console.error('Email エラー詳細:', emailResult.error);
      fail(`Email の作成に失敗しました: ${emailResult.error.message}`);
    }
    const nonExistentEmail = emailResult.value;

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
    const createdUsers = [];

    for (let i = 0; i < 5; i++) {
      const userIdResult = UserId.generate();
      if (userIdResult.isErr())
        fail(`UserId${i} の生成に失敗しました: ${userIdResult.error.message}`);
      const userId = userIdResult.value;

      // 値オブジェクト作成 - エラー時にメッセージを表示
      const userNameResult = UserName.create(`ユーザー${i}`);
      if (userNameResult.isErr()) {
        console.error(`UserName${i} エラー詳細:`, userNameResult.error);
        fail(`UserName${i} の作成に失敗しました: ${userNameResult.error.message}`);
      }
      const userName = userNameResult.value;

      const emailResult = Email.create(`user${i}@example.com`);
      if (emailResult.isErr()) {
        console.error(`Email${i} エラー詳細:`, emailResult.error);
        fail(`Email${i} の作成に失敗しました: ${emailResult.error.message}`);
      }
      const email = emailResult.value;

      const passwordHashResult = PasswordHash.create(`hash${i}`);
      if (passwordHashResult.isErr()) {
        console.error(`PasswordHash${i} エラー詳細:`, passwordHashResult.error);
        fail(`PasswordHash${i} の作成に失敗しました: ${passwordHashResult.error.message}`);
      }
      const passwordHash = passwordHashResult.value;

      // create でユーザー作成後、reconstruct で特定IDを持つユーザーに変換
      const userResult = User.create({ name: userName, email, passwordHash });
      if (userResult.isErr()) {
        console.error(`User${i} エラー詳細:`, userResult.error);
        fail(`User${i} の作成に失敗しました: ${userResult.error.message}`);
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

      createdUsers.push(userWithId);
      await userRepository.save(userWithId);
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

    expect(allUsers.length).toBe(5);
    expect(limitedUsers.length).toBe(3);
    expect(offsetUsers.length).toBe(3); // 5-2=3
    expect(paginatedUsers.length).toBe(2);
  });
});
