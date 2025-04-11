import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserDTO } from '@core/user/application/dtos/user.dto';
import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import { UserName } from '@core/user/domain/value-objects/user-name.vo';
import { User } from '@core/user/domain/entities/user.entity';
import { UserRepositoryInterface } from '@core/user/domain/repositories/user.repository.interface';
import { AppError } from '@core/shared/errors/app.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo';

import { ListUsersUsecase } from '../list-users.usecase';

describe('ListUsersUsecase', () => {
  // モックの準備
  const mockUserRepository: UserRepositoryInterface = {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn(),
  };

  // ロガーのモック
  const mockLogger: LoggerInterface = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  // テスト対象のユースケース
  let listUsersUsecase: ListUsersUsecase;

  // テスト用のユーザーエンティティ配列
  const mockUsers = [
    {
      id: { value: '01234567-89ab-cdef-0123-456789abcdef' } as UserId,
      name: { value: 'ユーザー1' } as UserName,
      email: { value: 'user1@example.com' } as Email,
      passwordHash: { value: 'hashed_password_1' } as PasswordHash,
      createdAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
      updatedAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
    } as User,
    {
      id: { value: '12345678-9abc-def0-1234-56789abcdef0' } as UserId,
      name: { value: 'ユーザー2' } as UserName,
      email: { value: 'user2@example.com' } as Email,
      passwordHash: { value: 'hashed_password_2' } as PasswordHash,
      createdAt: { value: '2023-01-02T00:00:00Z' } as DateTimeString,
      updatedAt: { value: '2023-01-02T00:00:00Z' } as DateTimeString,
    } as User,
  ];

  // ユーザーDTOのモック
  const _mockUserDTOs = [
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      name: 'テストユーザー1',
      email: 'test1@example.com',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: '12345678-89ab-cdef-0123-456789abcdef',
      name: 'テストユーザー2',
      email: 'test2@example.com',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z',
    },
  ] as UserDTO[];

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // ユースケースのインスタンスを作成
    listUsersUsecase = new ListUsersUsecase(mockUserRepository, mockLogger);
  });

  it('正常系: ユーザー一覧を取得し、DTOの配列を返す', async () => {
    // モックリポジトリの挙動を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findAll as Mock).mockResolvedValue(ok(mockUsers));

    // 実行
    const result = await listUsersUsecase.execute();

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTOs = result.value;

      // 配列の長さが一致することを検証
      expect(userDTOs).toHaveLength(2);

      // 各DTOの基本的な構造を検証
      expect(userDTOs[0]).toHaveProperty('id', '01234567-89ab-cdef-0123-456789abcdef');
      expect(userDTOs[0]).toHaveProperty('name', 'ユーザー1');
      expect(userDTOs[0]).toHaveProperty('email', 'user1@example.com');
      expect(userDTOs[0]).toHaveProperty('createdAt');
      expect(userDTOs[0]).toHaveProperty('updatedAt');

      expect(userDTOs[1]).toHaveProperty('id', '12345678-9abc-def0-1234-56789abcdef0');
      expect(userDTOs[1]).toHaveProperty('name', 'ユーザー2');
      expect(userDTOs[1]).toHaveProperty('email', 'user2@example.com');

      // モックが期待通り呼び出されたか検証
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith({});
    }
  });

  it('正常系: ページネーションパラメータを指定してユーザー一覧を取得する', async () => {
    // モックリポジトリの挙動を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findAll as Mock).mockResolvedValue(ok(mockUsers));

    // 実行 - ページネーションパラメータを指定
    const limit = 10;
    const offset = 5;
    const result = await listUsersUsecase.execute({ limit, offset });

    // 検証
    expect(result.isOk()).toBe(true);

    // モックが期待通り呼び出されたか検証
    expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findAll).toHaveBeenCalledWith({ limit, offset });
  });

  it('正常系: 空の配列を返す場合', async () => {
    // モックリポジトリの挙動を設定 - 空配列を返す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findAll as Mock).mockResolvedValue(ok([]));

    // 実行
    const result = await listUsersUsecase.execute();

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
      expect(result.value).toHaveLength(0);
    }
  });

  it('正常系: emailパラメータを指定して特定のユーザーを取得する', async () => {
    // モックの準備
    const emailToFind = 'user1@example.com';
    const emailVo = Email.create(emailToFind)._unsafeUnwrap(); // unwrapでOK (テストなので)
    const userFound = mockUsers[0]; // emailが一致するユーザーをモックから取得

    // findByEmail が呼ばれたときのモックの挙動を設定
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(ok(userFound));

    // 実行
    const result = await listUsersUsecase.execute({ email: emailToFind });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTOs = result.value;
      expect(userDTOs).toHaveLength(1);
      expect(userDTOs[0].email).toBe(emailToFind);

      // findByEmail が正しい引数で呼ばれたか検証
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(emailVo);
      // findAll は呼ばれないことを確認
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    }
  });

  it('正常系: 存在しないemailを指定した場合、空の配列を返す', async () => {
    const nonExistentEmail = 'notfound@example.com';
    const emailVo = Email.create(nonExistentEmail)._unsafeUnwrap();

    // findByEmail が null を返すようにモックを設定
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(ok(null));

    // 実行
    const result = await listUsersUsecase.execute({ email: nonExistentEmail });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
      // findByEmail が呼ばれたか検証
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(emailVo);
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    }
  });

  it('異常系: 不正なemail形式を指定した場合、ValidationErrorを返す', async () => {
    const invalidEmail = 'invalid-email-format';

    // 実行
    const result = await listUsersUsecase.execute({ email: invalidEmail });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid email format for filtering');
      // リポジトリメソッドは呼ばれないことを確認
      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    }
  });

  it('異常系: findByEmailでリポジトリエラーが発生した場合、エラーを返す', async () => {
    const emailToFind = 'error@example.com';
    const emailVo = Email.create(emailToFind)._unsafeUnwrap();
    const dbError = new InfrastructureError(ErrorCode.DatabaseError, 'DB connection error');

    // findByEmail がエラーを返すようにモックを設定
    (mockUserRepository.findByEmail as Mock).mockResolvedValue(err(dbError));

    // 実行
    const result = await listUsersUsecase.execute({ email: emailToFind });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      // AppErrorでラップされているか、元のエラーかを確認
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      // expect(result.error.message).toContain('Failed to search user by email');
      // InfrastructureErrorがAppErrorを継承しているため、元のエラーメッセージがそのまま返される
      expect(result.error.message).toBe('DB connection error');
      // findByEmail が呼ばれたか検証
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(emailVo);
      expect(mockUserRepository.findAll).not.toHaveBeenCalled();
    }
  });

  it('異常系: リポジトリからのエラーを処理する', async () => {
    // モックリポジトリの挙動を設定 - エラーを返す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findAll as Mock).mockResolvedValue(
      err(
        new InfrastructureError(ErrorCode.DatabaseError, 'Failed to retrieve user list', {
          cause: new Error('DB error'),
        })
      )
    );

    // 実行
    const result = await listUsersUsecase.execute();

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to retrieve user list');
    }

    // モックが期待通り呼び出されたか検証
    expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
