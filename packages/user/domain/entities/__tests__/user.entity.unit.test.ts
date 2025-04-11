import { validate as uuidValidate } from 'uuid';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as DateTimeStringModule from '@core/shared/value-objects/date-time-string.vo';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo';

import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import { UserName } from '@core/user/domain/value-objects/user-name.vo';
import { User } from '../user.entity';

describe('User Entity', () => {
  let validEmail: Email;
  let validName: UserName;
  let validPasswordHash: PasswordHash;
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

    const nameResult = UserName.create('Test User');
    if (nameResult.isErr()) throw new Error('Setup failed: Invalid UserName');
    validName = nameResult.value;

    const hashResult = PasswordHash.create('hashedPassword123');
    if (hashResult.isErr()) throw new Error('Setup failed: Invalid PasswordHash');
    validPasswordHash = hashResult.value;
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

    // Remove tests for empty name/passwordHash, as User.create now expects valid VOs
    // These validation scenarios should be tested in UserName.test.ts and PasswordHash.test.ts
    // it('should return an error if name is empty', () => { ... });
    // it('should return an error if name consists only of whitespace', () => { ... });
    // it('should return an error if passwordHash is empty', () => { ... });

    // Test for trimming is implicitly covered by UserName VO tests if UserName.create handles trimming.
    // We don't need to test it again at the User entity level.
    // it('should trim the name property', () => { ... });
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
    let user1: User;
    let user1SameId: User;
    let user3: User;

    // Setup users within this describe block as User.create signature changed
    beforeEach(() => {
      const props1 = { email: validEmail, name: validName, passwordHash: validPasswordHash };
      const user1Result = User.create(props1);
      if (user1Result.isErr()) throw new Error('Setup failed for user1');
      user1 = user1Result.value;

      // Prepare VOs for other users
      const email2 = Email.create('another@example.com')._unsafeUnwrap();
      const name2 = UserName.create('User Two')._unsafeUnwrap();
      const hash2 = PasswordHash.create('validHashPlaceholder2')._unsafeUnwrap();
      const email3 = Email.create('user3@example.com')._unsafeUnwrap();
      const name3 = UserName.create('User Three')._unsafeUnwrap();
      const hash3 = PasswordHash.create('validHashPlaceholder3')._unsafeUnwrap();

      user1SameId = User.reconstruct({
        id: user1.id, // Same ID
        email: email2,
        name: name2,
        passwordHash: hash2,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      });

      const props3 = { email: email3, name: name3, passwordHash: hash3 };
      const user3Result = User.create(props3);
      if (user3Result.isErr()) throw new Error('Setup failed for user3');
      user3 = user3Result.value;
    });

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
      expect(user1.equals(null)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      expect(user1.equals(undefined)).toBe(false);
    });
  });
});
