import { validate as uuidValidate } from 'uuid';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import * as DateTimeStringModule from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';

import { UserId } from '../user-id.vo';
import { User } from '../user.entity';

describe('User Entity', () => {
  let validEmail: Email;
  const validName = 'Test User';
  const validPasswordHash = 'hashedPassword123';
  let fixedNow: DateTimeStringModule.DateTimeString;
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const fixedDate = new Date('2024-01-01T10:00:00.000Z');
    const fixedDateTimeStringResult = DateTimeStringModule.DateTimeString.create(
      fixedDate.toISOString()
    );
    if (fixedDateTimeStringResult.isErr()) {
      throw new Error('Failed to create fixed DateTimeString in test setup');
    }
    fixedNow = fixedDateTimeStringResult.value;

    nowSpy = vi.spyOn(DateTimeStringModule.DateTimeString, 'now').mockReturnValue(fixedNow);

    const emailResult = Email.create('test@example.com');
    if (emailResult.isErr()) throw new Error('Setup failed: Invalid Email');
    validEmail = emailResult.value;
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  describe('create static method', () => {
    it('should create a User instance with valid properties', () => {
      const props = {
        email: validEmail,
        name: validName,
        passwordHash: validPasswordHash,
      };
      const result = User.create(props);

      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBeInstanceOf(UserId);
      expect(uuidValidate(user.id.value)).toBe(true);
      expect(user.email).toBe(validEmail);
      expect(user.name).toBe(validName);
      expect(user.passwordHash).toBe(validPasswordHash);
      expect(user.createdAt).toEqual(fixedNow);
      expect(user.updatedAt).toEqual(fixedNow);
    });

    it('should trim the name property', () => {
      const props = {
        email: validEmail,
        name: '  Test User  ',
        passwordHash: validPasswordHash,
      };
      const result = User.create(props);
      expect(result.isOk()).toBe(true);
      const user = result._unsafeUnwrap();
      expect(user.name).toBe('Test User');
    });

    it('should return an error if name is empty', () => {
      const props = {
        email: validEmail,
        name: '',
        passwordHash: validPasswordHash,
      };
      const result = User.create(props);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      expect(error.message).toContain('User name cannot be empty');
    });

    it('should return an error if name consists only of whitespace', () => {
      const props = {
        email: validEmail,
        name: '   ',
        passwordHash: validPasswordHash,
      };
      const result = User.create(props);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      expect(error.message).toContain('User name cannot be empty');
    });

    it('should return an error if passwordHash is empty', () => {
      const props = {
        email: validEmail,
        name: validName,
        passwordHash: '',
      };
      const result = User.create(props);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(BaseError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      expect(error.message).toContain('Password hash cannot be empty');
    });

    // Add tests for invalid email if Email.create were part of User.create logic
  });

  describe('reconstruct static method', () => {
    it('should reconstruct a User instance with provided properties', () => {
      const userId = UserId.generate()._unsafeUnwrap();
      const createdAt = DateTimeStringModule.DateTimeString.create(
        '2023-01-01T00:00:00.000Z'
      )._unsafeUnwrap();
      const updatedAt = DateTimeStringModule.DateTimeString.create(
        '2023-01-10T12:00:00.000Z'
      )._unsafeUnwrap();

      const props = {
        id: userId,
        email: validEmail,
        name: validName,
        passwordHash: validPasswordHash,
        createdAt: createdAt,
        updatedAt: updatedAt,
      };
      const user = User.reconstruct(props);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(userId);
      expect(user.email).toBe(validEmail);
      expect(user.name).toBe(validName);
      expect(user.passwordHash).toBe(validPasswordHash);
      expect(user.createdAt).toBe(createdAt);
      expect(user.updatedAt).toBe(updatedAt);
    });
  });

  describe('equals method', () => {
    const props1 = { email: validEmail, name: 'User One', passwordHash: 'hash1' };
    const user1Result = User.create(props1);
    if (user1Result.isErr()) throw new Error('Setup failed for user1');
    const user1 = user1Result.value;

    // Manually create a second user with the SAME ID as user1 for testing equals
    const user1SameId = User.reconstruct({
      id: user1.id, // Same ID
      email: Email.create('another@example.com')._unsafeUnwrap(),
      name: 'User Two',
      passwordHash: 'hash2',
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });

    const props3 = {
      email: Email.create('user3@example.com')._unsafeUnwrap(),
      name: 'User Three',
      passwordHash: 'hash3',
    };
    const user3Result = User.create(props3);
    if (user3Result.isErr()) throw new Error('Setup failed for user3');
    const user3 = user3Result.value;

    it('should return true for the same User instance', () => {
      expect(user1.equals(user1)).toBe(true);
    });

    it('should return true for different instances with the same ID', () => {
      expect(user1.equals(user1SameId)).toBe(true);
    });

    it('should return false for different instances with different IDs', () => {
      expect(user1.equals(user3)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // @ts-expect-error Testing comparison with null which expects a different type
      expect(user1.equals(null)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      // @ts-expect-error Testing comparison with undefined which expects a different type
      expect(user1.equals(undefined)).toBe(false);
    });

    // Although EntityBase interface doesn't prevent comparison with other Entity types,
    // the equals method in BaseId (used by UserId.equals) checks constructor type.
    // If we implement equals directly in User, this test might be needed.
    // For now, UserId.equals handles the type check.
    // it('should return false when comparing with an object of a different entity type', () => {
    //   // Mock another entity type
    //   class MockEntity implements EntityBase { /* ... */ }
    //   const mockEntity = new MockEntity(/* ... */);
    //   expect(user1.equals(mockEntity as any)).toBe(false);
    // });
  });
});
