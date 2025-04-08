import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserDTO } from '@/application/dtos/user.dto';
import { UserId } from '@/domain/models/user/user-id.vo';
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

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
