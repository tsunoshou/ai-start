import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { UserId } from '@/domain/models/user/user-id.vo';
import type { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import type { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import type { Email } from '@/shared/value-objects/email.vo';
import type { PasswordHash } from '@/shared/value-objects/password-hash.vo';

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
    deleteUserUsecase = new DeleteUserUsecase(mockUserRepository);
  });

  it('正常系: ユーザーを正常に削除する', async () => {
    // モックリポジトリの挙動を設定
    // findByIdは使用しないので、モックを削除
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.delete as Mock).mockResolvedValue(ok(undefined));

    // 実行 - オブジェクト形式で入力
    const userId = '01234567-89ab-cdef-0123-456789abcdef';
    const result = await deleteUserUsecase.execute({ userId });

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      // 戻り値はundefined
      expect(result.value).toBeUndefined();
      
      // findByIdは呼ばれない
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      
      // deleteが呼ばれる
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith({ value: userId });
    }
  });

  it('異常系: 無効なユーザーIDを指定した場合', async () => {
    // 無効なID
    const invalidUserId = 'invalid-id-format';

    // 実行 - オブジェクト形式で入力
    const result = await deleteUserUsecase.execute({ userId: invalidUserId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid user ID format');
    }

    // モックが呼ばれていないことを検証
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(mockUserRepository.delete).not.toHaveBeenCalled();
  });

  it('異常系: リポジトリからのdeleteでエラーが発生した場合', async () => {
    // モックリポジトリの挙動を設定 - deleteでエラー
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.delete as Mock).mockResolvedValue(
      err(new InfrastructureError('ユーザー削除に失敗しました', { cause: new Error('DB error') }))
    );

    // 実行 - オブジェクト形式で入力
    const userId = '01234567-89ab-cdef-0123-456789abcdef';
    const result = await deleteUserUsecase.execute({ userId });

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to delete user');
    }

    // findByIdは呼ばれない
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    // deleteが呼ばれる
    expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
  });
}); 