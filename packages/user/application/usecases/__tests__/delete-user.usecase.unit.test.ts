import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import type { UserName } from '@core/user/domain/value-objects/user-name.vo';
import { User } from '@core/user/domain/entities/user.entity';
import { UserRepositoryInterface } from '@core/user/domain/repositories/user.repository.interface';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import type { DateTimeString } from '@core/shared/value-objects/date-time-string.vo';
import type { Email } from '@core/shared/value-objects/email.vo';
import type { PasswordHash } from '@core/shared/value-objects/password-hash.vo';

import { DeleteUserUsecase } from '../delete-user.usecase';

// 未使用型宣言の抑制 - ESLint対策
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _Result = Result<unknown, unknown>;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _UserId = UserId;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _UserName = UserName;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _DateTimeString = DateTimeString;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _Email = Email;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _PasswordHash = PasswordHash;

describe('DeleteUserUsecase', () => {
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
  let deleteUserUsecase: DeleteUserUsecase;

  // テスト用のユーザーエンティティ
  const _mockUser = {
    id: { value: '01234567-89ab-cdef-0123-456789abcdef' } as UserId,
    name: { value: 'テストユーザー' } as UserName,
    email: { value: 'test@example.com' } as Email,
    passwordHash: { value: 'hashed_password' } as PasswordHash,
    createdAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
    updatedAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
  } as User;

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // ユースケースのインスタンスを作成
    deleteUserUsecase = new DeleteUserUsecase(mockUserRepository, mockLogger);
  });

  it('正常系: 存在するユーザーIDでユーザーを削除できる', async () => {
    // 有効なユーザーID
    const validUseId = '550e8400-e29b-41d4-a716-446655440000';

    // モックリポジトリの挙動を設定 - 削除に成功
    (mockUserRepository.findById as Mock).mockResolvedValue(ok({}));
    (mockUserRepository.delete as Mock).mockResolvedValue(ok(undefined));

    // 実行
    const result = await deleteUserUsecase.execute({ userId: validUseId });

    // 検証
    expect(result.isOk()).toBe(true);

    // モックが期待通り呼び出されたか検証
    const userIdArg = (mockUserRepository.delete as Mock).mock.calls[0][0];
    expect(userIdArg).toBeInstanceOf(UserId); // 適切なValueObjectに変換されている
    expect(userIdArg.value).toBe(validUseId); // 正しい値が設定されている
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('異常系: 不正な形式のユーザーIDでエラーを返す', async () => {
    // 不正なユーザーID形式
    const invalidUserId = 'not-a-uuid';

    // 実行
    const result = await deleteUserUsecase.execute({ userId: invalidUserId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid user ID format');
    }

    // リポジトリのdeleteメソッドが呼ばれていないことを検証
    expect(mockUserRepository.delete).not.toHaveBeenCalled();
  });

  it('異常系: データベース操作に失敗した場合エラーを返す', async () => {
    // 有効なユーザーID
    const validUseId = '550e8400-e29b-41d4-a716-446655440000';

    // モックリポジトリの挙動を設定 - findByIdは成功、削除に失敗
    (mockUserRepository.findById as Mock).mockResolvedValue(ok({}));
    (mockUserRepository.delete as Mock).mockResolvedValue(
      err(
        new InfrastructureError(ErrorCode.DatabaseError, 'Failed to delete user', {
          cause: new Error('DB error'),
        })
      )
    );

    // 実行
    const result = await deleteUserUsecase.execute({ userId: validUseId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to delete user');
    }

    // エラーログが呼び出されたことを検証
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
