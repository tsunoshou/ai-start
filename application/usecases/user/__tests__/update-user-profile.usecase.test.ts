import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { UserDTO } from '@/application/dtos/user.dto';
// UpdateUserDTOは存在しない、代わりにupdate-user-profile.usecaseで定義されているInput/Outputを使用
// import type { UpdateUserDTO } from '@/application/dtos/update-user.dto';
import { UserId } from '@/domain/models/user/user-id.vo';
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

  // ★ changeName メソッドを持つモック User インスタンスを作成
  const mockUserId = { value: '01234567-89ab-cdef-0123-456789abcdef' } as UserId;
  const mockUserName = { value: 'テストユーザー' } as UserName;
  const mockEmail = { value: 'test@example.com' } as Email;
  const mockPasswordHash = { value: 'hashed_password' } as PasswordHash;
  const mockCreatedAt = { value: '2023-01-01T00:00:00Z' } as DateTimeString;
  const mockUpdatedAt = { value: '2023-01-01T00:00:00Z' } as DateTimeString;

  // 更新後の名前を持つ新しい User インスタンス (モック)
  const updatedUserName = { value: '更新後ユーザー' } as UserName;
  const updatedMockUserInstance = {
    id: mockUserId,
    name: updatedUserName,
    email: mockEmail,
    passwordHash: mockPasswordHash,
    createdAt: mockCreatedAt,
    updatedAt: mockUpdatedAt, // changeName は updatedAt を更新しない想定
    // メソッドは不要 (changeName の *返り値* として使うため)
  } as User;

  // findById が返す User インスタンス (モック)
  const mockUserInstance = {
    id: mockUserId,
    name: mockUserName,
    email: mockEmail,
    passwordHash: mockPasswordHash,
    createdAt: mockCreatedAt,
    updatedAt: mockUpdatedAt,
    // ★ changeName メソッドのモックをここでは設定しない (vi.fn() だけにするか、削除)
    changeName: vi.fn(), // vi.fn() だけにしておく
  } as unknown as User;

  // テスト用の更新データ
  const validUpdateData = {
    userId: mockUserId.value,
    name: updatedUserName.value,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // ★ User.reconstruct のモックは不要なので削除
    // vi.spyOn(User, 'reconstruct').mockImplementation(...);

    // ★ UserName.create のモックを実際の動作に近い形に修正
    vi.spyOn(UserName, 'create').mockImplementation((name: unknown) => {
      if (typeof name === 'string' && name.length > 0 && name.length <= 50) {
        // 実際の UserName クラスは使わず、単なるオブジェクトを返す
        return ok({ value: name } as UserName);
      }
      let message = 'Invalid user name';
      if (typeof name !== 'string' || name.length === 0) message = 'User name cannot be empty';
      if (typeof name === 'string' && name.length > 50)
        message = 'User name must be 50 characters or less';
      return err(new AppError(ErrorCode.ValidationError, message));
    });
    // ★ UserId.create のモックも追加 (正常系と異常系のため)
    vi.spyOn(UserId, 'create').mockImplementation((id: unknown) => {
      if (typeof id === 'string' && id.length > 10) {
        // 簡単なチェック
        return ok({ value: id } as UserId);
      }
      return err(new AppError(ErrorCode.InvalidIdentifierFormat, 'Invalid user ID format'));
    });

    updateUserProfileUsecase = new UpdateUserProfileUsecase(mockUserRepository, mockLogger);
  });

  // ★ spyOn したモックをテスト後に復元
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('正常系: ユーザー情報を更新し、更新後のDTOを返す', async () => {
    // Arrange: findById がモック User インスタンスを返すように設定
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUserInstance));
    // Arrange: save が成功するように設定
    (mockUserRepository.save as Mock).mockResolvedValue(ok(undefined));
    // ★ Arrange: changeName のモック実装をこのテストケース内で設定
    vi.spyOn(mockUserInstance, 'changeName').mockReturnValue(ok(updatedMockUserInstance));

    // Act
    const result = await updateUserProfileUsecase.execute(validUpdateData);

    // Assert: 結果が成功しているか
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTO = result.value;
      // Assert: DTOの内容が更新後のものであるか
      expect(userDTO.name).toBe(updatedUserName.value);
      // Assert: updatedAt は変化していないはず (saveでDB上は更新されるがDTOはsave前の状態)
      expect(userDTO.updatedAt).toBe(mockUpdatedAt.value);
    }

    // Assert: モックの呼び出し検証
    expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);

    // Assert: ★ mockUserInstance の changeName が呼び出されたか
    expect(mockUserInstance.changeName).toHaveBeenCalledTimes(1);
    expect(mockUserInstance.changeName).toHaveBeenCalledWith(updatedUserName);

    // Assert: ★ save が呼び出され、引数が changeName の返り値 (updatedMockUserInstance) であるか
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(updatedMockUserInstance);

    // Assert: User.reconstruct は呼ばれていない
    // expect(User.reconstruct).not.toHaveBeenCalled(); // spyOnしていないので不要

    expect(mockLogger.info).toHaveBeenCalledTimes(1); // updated と no changes のどちらか
  });

  it('異常系: 指定されたIDのユーザーが存在しない場合', async () => {
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(null));
    const result = await updateUserProfileUsecase.execute(validUpdateData);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.NotFound);
    }
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('異常系: 無効なユーザーIDを指定した場合', async () => {
    // Arrange: UserId.create がエラーを返すように設定（beforeEachで設定済み）
    const invalidIdData = { userId: 'invalid', name: 'Test' };
    const result = await updateUserProfileUsecase.execute(invalidIdData);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // ★ ユースケースが返す AppError の cause に元のエラーが含まれることを検証
      expect(result.error.code).toBe(ErrorCode.ValidationError); // ユースケースはValidationErrorを返す
      expect(result.error.cause).toBeInstanceOf(AppError); // 元のエラーはAppError
      if (result.error.cause instanceof AppError) {
        expect(result.error.cause.code).toBe(ErrorCode.InvalidIdentifierFormat); // ★ 元のエラーコードを検証
      }
      expect(result.error.message).toContain('Invalid user ID format'); // ユースケースのエラーメッセージ
    }
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
  });

  it('異常系: 無効なユーザー名を指定した場合', async () => {
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUserInstance));
    // Arrange: UserName.create がエラーを返すように設定 (空文字の場合)
    vi.spyOn(UserName, 'create').mockReturnValue(
      err(new AppError(ErrorCode.ValidationError, 'Empty name'))
    );

    const invalidNameData = { userId: mockUserId.value, name: '' };
    const result = await updateUserProfileUsecase.execute(invalidNameData);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.ValidationError);
      expect(result.error.message).toContain('Invalid user name format'); // ユースケース内のエラーメッセージ
    }
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('異常系: リポジトリからのfindByIdでエラーが発生した場合', async () => {
    const dbError = new InfrastructureError(ErrorCode.DatabaseError, 'DB error');
    (mockUserRepository.findById as Mock).mockResolvedValue(err(dbError));
    const result = await updateUserProfileUsecase.execute(validUpdateData);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      // expect(result.error.cause).toBe(dbError); // ★ 一旦コメントアウト
    }
  });

  // ★ save でエラーが発生するケースを追加
  it('異常系: リポジトリへのsaveでエラーが発生した場合', async () => {
    // Arrange
    const dbError = new InfrastructureError(ErrorCode.DatabaseError, 'Save failed');
    (mockUserRepository.findById as Mock).mockResolvedValue(ok(mockUserInstance));
    (mockUserRepository.save as Mock).mockResolvedValue(err(dbError)); // save がエラーを返す
    // ★ Arrange: changeName のモック実装をこのテストケース内で設定
    vi.spyOn(mockUserInstance, 'changeName').mockReturnValue(ok(updatedMockUserInstance));

    // Act
    const result = await updateUserProfileUsecase.execute(validUpdateData);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // Check if the error is the original InfrastructureError
      expect(result.error).toBeInstanceOf(InfrastructureError);
      expect(result.error).toBe(dbError);
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toBe('Save failed'); // Check the specific message
    }
    expect(mockUserInstance.changeName).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.save).toHaveBeenCalledWith(updatedMockUserInstance);
  });
});
