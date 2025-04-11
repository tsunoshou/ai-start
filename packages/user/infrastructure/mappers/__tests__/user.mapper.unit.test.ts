import 'reflect-metadata';
import { describe, it, expect } from 'vitest';

import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo';
import { UserDTO } from '@core/user/application/dtos/user.dto';
import { User } from '@core/user/domain/entities/user.entity';
import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import { UserName } from '@core/user/domain/value-objects/user-name.vo';

import { UserMapper, UserDbSelect } from '../user.mapper'; // Adjust path if necessary

describe('UserMapper', () => {
  // Helper to create a valid User entity for testing
  // Returns the created user and the generated userId for assertion comparison
  const createTestUser = (idSuffix: string, dateString: string): { user: User; userId: UserId } => {
    // Use UserId.generate() to create a valid UUID
    const userIdResult = UserId.generate();
    const emailResult = Email.create(`test-${idSuffix}@example.com`);
    const nameResult = UserName.create(`Test User ${idSuffix}`);
    const passwordResult = PasswordHash.create(`hashedPassword-${idSuffix}`);
    const dateResult = DateTimeString.create(dateString);

    if (
      userIdResult.isErr() || // generate should theoretically not fail easily, but check anyway
      emailResult.isErr() ||
      nameResult.isErr() ||
      passwordResult.isErr() ||
      dateResult.isErr()
    ) {
      console.error('UserID Error:', userIdResult.isErr() ? userIdResult.error : 'OK');
      console.error('Email Error:', emailResult.isErr() ? emailResult.error : 'OK');
      console.error('Name Error:', nameResult.isErr() ? nameResult.error : 'OK');
      console.error('Password Error:', passwordResult.isErr() ? passwordResult.error : 'OK');
      console.error('Date Error:', dateResult.isErr() ? dateResult.error : 'OK');
      throw new Error(
        `Failed to create test user prerequisites for suffix ${idSuffix} with date ${dateString}`
      );
    }

    const userId = userIdResult.value;
    const user = User.reconstruct({
      id: userId, // Use the generated userId
      email: emailResult.value,
      name: nameResult.value,
      passwordHash: passwordResult.value,
      createdAt: dateResult.value,
      updatedAt: dateResult.value,
    });
    return { user, userId }; // Return both user and the generated ID
  };

  describe('Static toDTO', () => {
    it('should map a User entity to a UserDTO, excluding sensitive data', () => {
      // Arrange
      const testDate = '2024-01-01T10:00:00.000Z';
      // Destructure the user and userId from the helper
      const { user: userEntity, userId } = createTestUser('1', testDate);

      // Act
      const userDTO = UserMapper.toDTO(userEntity);

      // Assert
      const expectedDTO: UserDTO = {
        id: userId.value, // Use the generated userId value
        name: 'Test User 1',
        email: 'test-1@example.com',
        createdAt: testDate,
        updatedAt: testDate,
      };
      expect(userDTO).toEqual(expectedDTO);
      expect(userDTO).not.toHaveProperty('passwordHash');
    });

    it('should correctly extract values from Value Objects', () => {
      // Arrange
      const testDate = '2024-01-02T12:30:00.000Z';
      const { user: userEntity } = createTestUser('2', testDate);

      // Act
      const userDTO = UserMapper.toDTO(userEntity);

      // Assert
      expect(userDTO.id).toBe(userEntity.id.value);
      expect(userDTO.name).toBe(userEntity.name.value);
      expect(userDTO.email).toBe(userEntity.email.value);
      expect(userDTO.createdAt).toBe(userEntity.createdAt.value);
      expect(userDTO.updatedAt).toBe(userEntity.updatedAt.value);
      expect(userDTO.createdAt).toBe(testDate);
    });
  });

  describe('Static toDTOs', () => {
    it('should return an empty array if given an empty array of entities', () => {
      // Arrange
      const emptyUserArray: User[] = [];

      // Act
      const userDTOs = UserMapper.toDTOs(emptyUserArray);

      // Assert
      expect(userDTOs).toEqual([]);
    });

    it('should map an array of User entities to an array of UserDTOs', () => {
      // Arrange
      const date1 = '2024-01-03T10:00:00.000Z';
      const date2 = '2024-01-04T11:00:00.000Z';
      const { user: user1, userId: userId1 } = createTestUser('3', date1);
      const { user: user2, userId: userId2 } = createTestUser('4', date2);
      const userEntities = [user1, user2];

      // Act
      const userDTOs = UserMapper.toDTOs(userEntities);

      // Assert
      expect(userDTOs).toHaveLength(2);

      const expectedDTO1: UserDTO = {
        id: userId1.value, // Use generated ID
        name: 'Test User 3',
        email: 'test-3@example.com',
        createdAt: date1,
        updatedAt: date1,
      };
      const expectedDTO2: UserDTO = {
        id: userId2.value, // Use generated ID
        name: 'Test User 4',
        email: 'test-4@example.com',
        createdAt: date2,
        updatedAt: date2,
      };

      expect(userDTOs[0]).toEqual(expectedDTO1);
      expect(userDTOs[1]).toEqual(expectedDTO2);
      expect(userDTOs[0]).not.toHaveProperty('passwordHash');
      expect(userDTOs[1]).not.toHaveProperty('passwordHash');
    });
  });

  // 宣言的マッピングを使用したインスタンスメソッドのテスト
  describe('Instance methods with declarative mapping', () => {
    // テスト用のマッパーインスタンス
    let userMapper: UserMapper;

    // 各テストの前にマッパーを初期化
    beforeEach(() => {
      userMapper = new UserMapper();
    });

    describe('toDomain', () => {
      it('should convert a database record to a User entity', () => {
        // テスト用のデータを準備
        const id = '123e4567-e89b-12d3-a456-426614174000'; // 有効なUUID形式
        const email = 'test@example.com';
        const name = 'Test User';
        const passwordHash = 'hashed_password_123';
        const createdAt = new Date('2024-01-05T10:00:00.000Z');
        const updatedAt = new Date('2024-01-05T10:00:00.000Z');

        const dbRecord: UserDbSelect = {
          id,
          email,
          name,
          passwordHash,
          createdAt,
          updatedAt,
        };

        // 変換実行
        const result = userMapper.toDomain(dbRecord);

        // 検証
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const user = result.value;

          // エンティティの型と構造を検証
          expect(user).toBeInstanceOf(User);

          // 値オブジェクトの値を検証
          expect(user.id.value).toBe(id);
          expect(user.email.value).toBe(email);
          expect(user.name.value).toBe(name);
          expect(user.passwordHash.value).toBe(passwordHash);
          expect(user.createdAt.value).toBe(createdAt.toISOString());
          expect(user.updatedAt.value).toBe(updatedAt.toISOString());
        }
      });

      it('should return an error when a required field is missing', () => {
        // 必須フィールドが欠けているレコード
        const incompleteRecord: Partial<UserDbSelect> = {
          id: '123e4567-e89b-12d3-a456-426614174000', // 有効なUUID形式
          email: 'test@example.com',
          // nameが欠けている
          passwordHash: 'hashed_password',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 変換実行
        const result = userMapper.toDomain(incompleteRecord as UserDbSelect);

        // 検証
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.message).toContain('必須プロパティ');
          expect(result.error.message).toContain('name');
        }
      });
    });

    describe('toDTO', () => {
      it('should convert a User entity to a DTO', () => {
        // テスト用のユーザーエンティティを作成
        const testDate = '2024-01-06T10:00:00.000Z';
        const { user, userId } = createTestUser('dto-test', testDate);

        // 変換実行
        const result = userMapper.toDTO(user);

        // 検証
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const dto = result.value;

          // DTOの構造を検証
          expect(dto).toEqual({
            id: userId.value,
            name: 'Test User dto-test',
            email: 'test-dto-test@example.com',
            createdAt: testDate,
            updatedAt: testDate,
          });

          // 機密情報が含まれていないことを確認
          expect(dto).not.toHaveProperty('passwordHash');
        }
      });
    });

    describe('toPersistence', () => {
      it('should convert a User entity to a database record', () => {
        // テスト用のエンティティを準備
        const userId = UserId.create('b7388346-8235-4e02-95e5-8cf9a25e99bb')._unsafeUnwrap();
        const email = Email.create('test-persist-test@example.com')._unsafeUnwrap();
        const name = UserName.create('Test User persist-test')._unsafeUnwrap();
        const passwordHash = PasswordHash.create('hashedPassword-persist-test')._unsafeUnwrap();
        const createdAt = DateTimeString.create('2024-01-07T10:00:00.000Z')._unsafeUnwrap();
        const updatedAt = DateTimeString.create('2024-01-07T10:00:00.000Z')._unsafeUnwrap();

        const user = User.reconstruct({
          id: userId,
          email,
          name,
          passwordHash,
          createdAt,
          updatedAt,
        });

        // 変換実行
        const result = userMapper.toPersistence(user);

        // 検証
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const dbRecord = result.value;

          // DBレコードの構造を検証
          expect(dbRecord).toEqual({
            id: userId.value,
            name: 'Test User persist-test',
            email: 'test-persist-test@example.com',
            passwordHash: 'hashedPassword-persist-test',
            createdAt: new Date('2024-01-07T10:00:00.000Z'),
            updatedAt: new Date('2024-01-07T10:00:00.000Z'),
          });
        }
      });
    });
  });
});
