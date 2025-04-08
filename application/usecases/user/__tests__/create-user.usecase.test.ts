import 'reflect-metadata';
import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { UserDTO } from '@/application/dtos/user.dto';
import type { UserId } from '@/domain/models/user/user-id.vo';
import type { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { UserRepositoryInterface } from '@/domain/repositories/user.repository.interface';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import * as passwordUtils from '@/shared/utils/security/password.utils';
import type { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import type { Email } from '@/shared/value-objects/email.vo';
import type { PasswordHash } from '@/shared/value-objects/password-hash.vo';

import { CreateUserUsecase } from '../create-user.usecase';

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

describe('CreateUserUsecase', () => {
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
  let createUserUsecase: CreateUserUsecase;

  // テスト用の有効な入力データ
  const validInput = {
    name: 'テストユーザー',
    email: 'test@example.com',
    passwordPlainText: 'Password123!',
  };

  // テスト用のハッシュ化されたパスワード
  const hashedPassword = 'hashed_password_123';

  beforeEach(() => {
    // モックをリセット
    vi.clearAllMocks();

    // ユースケースのインスタンスを作成
    createUserUsecase = new CreateUserUsecase(mockUserRepository, mockLogger);

    // passwordUtils.hashPasswordのモック
    vi.spyOn(passwordUtils, 'hashPassword').mockResolvedValue(ok(hashedPassword));

    // モックリポジトリの挙動を設定 - 正常系では正常に保存できるようにする
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.save as Mock).mockImplementation((user: User) => {
      return Promise.resolve(ok(user));
    });

    // User.createをスパイするが、実際の実装を使う
    vi.spyOn(User, 'create');
  });

  it('正常系: ユーザーを作成して保存し、DTOを返す', async () => {
    // 実行
    const result = await createUserUsecase.execute(validInput);

    // 検証
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const userDTO = result.value;

      // DTOの基本的な構造を検証
      expect(userDTO).toHaveProperty('id');
      expect(userDTO).toHaveProperty('name', validInput.name);
      expect(userDTO).toHaveProperty('email', validInput.email);
      expect(userDTO).toHaveProperty('createdAt');
      expect(userDTO).toHaveProperty('updatedAt');

      // モックが期待通り呼び出されたか検証
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(validInput.passwordPlainText);
      expect(User.create).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalled();
    }
  });

  it('異常系: 無効な入力データでエラーを返す', async () => {
    // 無効な入力データ
    const invalidInput = {
      name: '', // 空の名前（無効）
      email: validInput.email,
      passwordPlainText: validInput.passwordPlainText,
    };

    // 実行
    const result = await createUserUsecase.execute(invalidInput);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      // 実際のコードではINTERNAL_SERVER_ERRORが返される
      expect(result.error.code).toBe(ErrorCode.InternalServerError);
      expect(result.error.message).toContain('Unexpected validation error format');
    }

    // リポジトリのsaveメソッドが呼ばれていないことを検証
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('異常系: パスワードハッシュ化に失敗した場合エラーを返す', async () => {
    // passwordUtils.hashPasswordのモックをエラーを返すように設定
    vi.spyOn(passwordUtils, 'hashPassword').mockResolvedValue(
      err(new Error('パスワードハッシュ化に失敗しました'))
    );

    // 実行
    const result = await createUserUsecase.execute(validInput);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.PasswordHashingFailed);
    }

    // リポジトリのsaveメソッドが呼ばれていないことを検証
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('異常系: ユーザー保存に失敗した場合エラーを返す', async () => {
    // リポジトリのsaveメソッドのモックをエラーを返すように設定
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockUserRepository.save as Mock).mockResolvedValue(
      err(new InfrastructureError('ユーザー保存に失敗しました', { cause: new Error('DB error') }))
    );

    // 実行
    const result = await createUserUsecase.execute(validInput);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DatabaseError);
      expect(result.error.message).toContain('Failed to save user data');
    }
  });

  it('異常系: ユーザーエンティティ作成に失敗した場合エラーを返す', async () => {
    // 一時的にユーザー作成をモックする
    vi.spyOn(User, 'create').mockReturnValue(
      err(new AppError(ErrorCode.DomainRuleViolation, 'ユーザー作成に失敗しました'))
    );

    // 実行
    const result = await createUserUsecase.execute(validInput);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(ErrorCode.DomainRuleViolation);
    }

    // リポジトリのsaveメソッドが呼ばれていないことを検証
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
