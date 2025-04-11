import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UserDTO } from '@core/user/application/dtos/user.dto.ts';
import { UserId } from '@core/user/domain/value-objects/user-id.vo.ts';
import { UserName } from '@core/user/domain/value-objects/user-name.vo.ts';
import { User } from '@core/user/domain/entities/user.entity.ts';
import { UserRepositoryInterface } from '@core/user/domain/repositories/user.repository.interface.ts';
import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error.ts';
import type { LoggerInterface } from '@core/shared/logger/logger.interface.ts';
import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo.ts';
import { Email } from '@core/shared/value-objects/email.vo.ts';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo.ts';

import { GetUserByIdUsecase } from '../get-user-by-id.usecase';

describe('GetUserByIdUsecase', () => {
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
  let getUserByIdUsecase: GetUserByIdUsecase;

  // テスト用の有効なユーザーID
  const validUserId = '01234567-89ab-cdef-0123-456789abcdef';

  // テスト用のユーザーエンティティ
  const mockUser = {
    id: { value: validUserId } as UserId,
    name: { value: 'テストユーザー' } as UserName,
    email: { value: 'test@example.com' } as Email,
    passwordHash: { value: 'hashed_password_123' } as PasswordHash,
    createdAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
    updatedAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
  } as User;

  // ユーザーDTOのモック
  const _mockUserDTO = {
    id: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'テストユーザー',
    email: 'test@example.com',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  } as UserDTO;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // ユースケースのインスタンスを作成
    getUserByIdUsecase = new GetUserByIdUsecase(mockUserRepository, mockLogger);

    // User.createをスパイするが、実際の実装を使う
    vi.spyOn(User, 'create');
  });

  it('正常系: 存在するユーザーIDでユーザーを取得し、DTOを返す', async () => {
    // モックリポジトリの挙動を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUser));

    // 実行
    const result = await getUserByIdUsecase.execute({ userId: validUserId });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTO = result.value;

      // DTOの基本的な構造を検証
      expect(userDTO).toHaveProperty('id', validUserId);
      expect(userDTO).toHaveProperty('name', 'テストユーザー');
      expect(userDTO).toHaveProperty('email', 'test@example.com');
      expect(userDTO).toHaveProperty('createdAt');
      expect(userDTO).toHaveProperty('updatedAt');

      // モックが期待通り呼び出されたか検証
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      // userIdがValueObjectとして渡されていることを検証
      const calledWith = (mockUserRepository.findById as Mock).mock.calls[0][0];
      expect(calledWith).toHaveProperty('value', validUserId);
    }
  });

  it('正常系: 存在しないユーザーIDでnullを返す', async () => {
    // モックリポジトリの挙動を設定 - ユーザーが見つからないケース
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(null));

    // 実行
    const result = await getUserByIdUsecase.execute({ userId: validUserId });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBeNull();

      // モックが期待通り呼び出されたか検証
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    }
  });

  it('異常系: 無効なユーザーIDでエラーを返す', async () => {
    // 無効なユーザーID
    const invalidUserId = 'invalid-uuid';

    // 実行
    const result = await getUserByIdUsecase.execute({ userId: invalidUserId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid user ID format');
    }

    // リポジトリのfindByIdメソッドが呼ばれていないことを検証
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
  });

  it('異常系: リポジトリからのエラーを処理する', async () => {
    // モックリポジトリの挙動を設定 - エラーを返す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(
      err(
        new InfrastructureError(ErrorCode.DatabaseError, 'Failed to retrieve user data', {
          cause: new Error('DB error'),
        })
      )
    );

    // 実行
    const result = await getUserByIdUsecase.execute({ userId: validUserId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to retrieve user data');
    }

    // モックが期待通り呼び出されたか検証
    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
  });
});
