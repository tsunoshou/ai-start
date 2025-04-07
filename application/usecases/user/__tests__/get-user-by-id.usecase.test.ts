import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { UserDTO } from '@/application/dtos/user.dto';
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

import { GetUserByIdUsecase } from '../get-user-by-id.usecase';

// 未使用型宣言の抑制 - ESLint対策
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _Result = Result<unknown, unknown>;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _UserDTO = UserDTO;
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

describe('GetUserByIdUsecase', () => {
  // モックの準備
  const mockUserRepository: UserRepositoryInterface = {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn(),
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
    getUserByIdUsecase = new GetUserByIdUsecase(mockUserRepository);

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
      err(new InfrastructureError('ユーザー検索に失敗しました', { cause: new Error('DB error') }))
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