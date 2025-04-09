import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { UserDTO } from '@/application/dtos/user.dto';
// UpdateUserDTOは存在しない、代わりにupdate-user-profile.usecaseで定義されているInput/Outputを使用
// import type { UpdateUserDTO } from '@/application/dtos/update-user.dto';
import type { UserId } from '@/domain/models/user/user-id.vo';
// UserNameはモックとして使用するので、typeをつけない
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import type { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import type { Email } from '@/shared/value-objects/email.vo';
import type { PasswordHash } from '@/shared/value-objects/password-hash.vo';

import { UpdateUserProfileUsecase } from '../update-user-profile.usecase';

// 未使用型宣言の抑制 - ESLint対策
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _Result = Result<unknown, unknown>;
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
type _UserDTO = UserDTO;
// UpdateUserDTOはありません
// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
// type _UpdateUserDTO = UpdateUserDTO;
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

describe('UpdateUserProfileUsecase', () => {
  // モックの準備
  const mockUserRepository: UserRepositoryInterface = {
    save: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn(),
  };

  // モックロガーの作成
  const mockLogger: LoggerInterface = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  // テスト対象のユースケース
  let updateUserProfileUsecase: UpdateUserProfileUsecase;

  // テスト用のユーザーエンティティ
  const mockUser = {
    id: { value: '01234567-89ab-cdef-0123-456789abcdef' } as UserId,
    name: { value: 'テストユーザー' } as UserName,
    email: { value: 'test@example.com' } as Email,
    passwordHash: { value: 'hashed_password' } as PasswordHash,
    createdAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
    updatedAt: { value: '2023-01-01T00:00:00Z' } as DateTimeString,
  } as User;

  // テスト用の更新データ（UpdateUserProfileInputに合わせる）
  const validUpdateData = {
    userId: '01234567-89ab-cdef-0123-456789abcdef',
    name: '更新後ユーザー',
  };

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // User.reconstructをモック
    vi.spyOn(User, 'reconstruct').mockImplementation((userData) => {
      return {
        ...mockUser,
        name: userData.name,
      } as User;
    });

    // UserNameのモックをリセット
    vi.spyOn(UserName, 'create').mockImplementation((name: unknown) => {
      // 有効な値ならValueObjectを返す、無効ならエラーを返す
      if (typeof name === 'string' && name.length > 0) {
        return ok({ value: name } as UserName);
      } else {
        return err(new AppError(ErrorCode.ValidationError, 'User name cannot be empty'));
      }
    });

    // ユースケースのインスタンスを作成
    updateUserProfileUsecase = new UpdateUserProfileUsecase(mockUserRepository, mockLogger);
  });

  it('正常系: ユーザー情報を更新し、更新後のDTOを返す', async () => {
    // モックリポジトリの挙動を設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUser));

    // 更新後のユーザーを返すようにモック設定
    const updatedUser = {
      ...mockUser,
      name: { value: '更新後ユーザー' } as UserName,
      updatedAt: { value: '2023-01-02T00:00:00Z' } as DateTimeString,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.save as Mock).mockResolvedValue(ok(updatedUser));

    // 実行
    const result = await updateUserProfileUsecase.execute(validUpdateData);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTO = result.value;

      // 更新されたデータを検証
      expect(userDTO).toHaveProperty('id', '01234567-89ab-cdef-0123-456789abcdef');
      expect(userDTO).toHaveProperty('name', '更新後ユーザー');
      expect(userDTO).toHaveProperty('email', 'test@example.com');

      // モックが期待通り呼び出されたか検証
      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findById).toHaveBeenCalledWith({
        value: '01234567-89ab-cdef-0123-456789abcdef',
      });

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      // User.reconstructが呼ばれていることを検証
      expect(User.reconstruct).toHaveBeenCalledTimes(1);

      // ロガーが呼ばれていることを検証
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    }
  });

  it('異常系: 指定されたIDのユーザーが存在しない場合', async () => {
    // モックリポジトリの挙動を設定 - ユーザーが見つからない
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(null));

    // 実行
    const result = await updateUserProfileUsecase.execute(validUpdateData);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.NotFound);
      // 実際のエラーメッセージに合わせる
      expect(result.error.message).toContain('User not found');
    }

    // saveメソッドが呼ばれていないことを検証
    expect(mockUserRepository.save).not.toHaveBeenCalled();

    // ロガーが呼ばれていることを検証
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
  });

  it('異常系: 無効なユーザーIDを指定した場合', async () => {
    // 無効なIDを持つデータ
    const invalidIdData = {
      userId: 'invalid-id-format',
      name: '更新後ユーザー',
    };

    // 実行
    const result = await updateUserProfileUsecase.execute(invalidIdData);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // ValidationErrorではなくAppErrorを使用
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid user ID format');
    }

    // モックが呼ばれていないことを検証
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(mockUserRepository.save).not.toHaveBeenCalled();

    // ロガーが呼ばれていることを検証
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('異常系: 無効なユーザー名を指定した場合', async () => {
    // モックリポジトリの挙動を設定 - ユーザーが存在する
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUser));

    // UserName.createのモックをオーバーライド - 明示的に空の名前に対してエラーを返す
    (UserName.create as Mock).mockImplementation((_name: unknown) => {
      return err(new AppError(ErrorCode.ValidationError, 'User name cannot be empty'));
    });

    // 無効な名前を持つデータ（空文字列）
    const invalidNameData = {
      userId: '01234567-89ab-cdef-0123-456789abcdef',
      name: '',
    };

    // 実行
    const result = await updateUserProfileUsecase.execute(invalidNameData);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // 実際には、実装ではValidationErrorエラーが返されるようです
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      // エラーメッセージにはUser nameに関する情報が含まれる
      expect(result.error.message).toContain('Invalid user name format');
    }

    // findByIdが呼ばれ、saveが呼ばれないことを検証
    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).not.toHaveBeenCalled();

    // ロガーが呼ばれていることを検証
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
  });

  it('異常系: リポジトリからのfindByIdでエラーが発生した場合', async () => {
    // モックリポジトリの挙動を設定 - findByIdでエラー
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.findById as Mock).mockResolvedValue(
      err(
        new InfrastructureError(ErrorCode.DatabaseError, 'Failed to retrieve user', {
          cause: new Error('DB error'),
        })
      )
    );

    // 実行
    const result = await updateUserProfileUsecase.execute(validUpdateData);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to retrieve user');
    }

    // saveメソッドが呼ばれていないことを検証
    expect(mockUserRepository.save).not.toHaveBeenCalled();

    // ロガーが呼ばれていることを検証
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
  });
});
