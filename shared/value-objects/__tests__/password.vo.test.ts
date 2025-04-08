import { ok, err, Result } from 'neverthrow';
import { describe, it, expect, vi } from 'vitest';

import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { ValidationError } from '@/shared/errors/validation.error';
import * as PasswordUtils from '@/shared/utils/security/password.utils';

import { PasswordHash } from '../password-hash.vo';
import { Password } from '../password.vo';

describe('Password Value Object', () => {
  const validPlainText = 'Password123!';
  const shortPlainText = 'Short1!';
  const validHashed = 'hashed_password_value_that_is_long_enough';

  // Mock PasswordHash.create for simplicity in Password tests
  vi.spyOn(PasswordHash, 'create').mockImplementation((hash: unknown) => {
    if (typeof hash === 'string' && hash.length >= 8) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ok({ value: hash } as any);
    } else {
      return err(new ValidationError('Mock PasswordHash create error: Invalid hash'));
    }
  });

  describe('create static method', () => {
    it('should create a Password instance for a valid plain text password', () => {
      const result = Password.create(validPlainText);
      expect(result.isOk()).toBe(true);
      const password = result._unsafeUnwrap();
      expect(password).toBeInstanceOf(Password);
      expect(password.value).toBe(validPlainText);
    });

    it('should return an error for a password that is too short', () => {
      const result = Password.create(shortPlainText);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      expect(error.message).toContain('Password must be at least 8 characters long');
    });

    it.each([
      [null],
      [undefined],
      [12345678],
      [''], // Empty string is also too short
    ])('should return an error for invalid input type or empty string: %s', (invalidInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = Password.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
    });
  });

  describe('fromHash static method', () => {
    it('should create a Password instance from a valid PasswordHash VO', () => {
      const hashVoResult = PasswordHash.create(validHashed);
      expect(hashVoResult.isOk()).toBe(true);
      const hashVo = hashVoResult._unsafeUnwrap();

      const result = Password.fromHash(hashVo);
      expect(result.isOk()).toBe(true);
      const password = result._unsafeUnwrap();
      expect(password).toBeInstanceOf(Password);
      expect(password.isHashed()).toBe(true);
      expect(password.value).toBe(validHashed); // The value should be the hash itself
    });
  });

  describe('isHashed method', () => {
    it('should return true for a password created from a hash', () => {
      const hashVoResult = PasswordHash.create(validHashed);
      const hashVo = hashVoResult._unsafeUnwrap();
      const password = Password.fromHash(hashVo)._unsafeUnwrap();
      expect(password.isHashed()).toBe(true);
    });

    it('should return false for a password created from plain text', () => {
      const password = Password.create(validPlainText)._unsafeUnwrap();
      expect(password.isHashed()).toBe(false);
    });
  });

  describe('compare method', () => {
    const validHashVo = PasswordHash.create(validHashed)._unsafeUnwrap();
    const passwordFromHash = Password.fromHash(validHashVo)._unsafeUnwrap();
    const passwordFromPlain = Password.create(validPlainText)._unsafeUnwrap();

    // Mock PasswordUtils.verifyPassword
    const verifySpy = vi
      .spyOn(PasswordUtils, 'verifyPassword')
      .mockImplementation(
        async (plain: string, hash: string): Promise<Result<boolean, AppError>> => {
          if (hash === validHashed && plain === validPlainText) {
            return ok(true);
          } else if (plain === 'wrongPassword') {
            return ok(false);
          } else if (plain === 'errorPassword') {
            return err(new AppError(ErrorCode.PasswordVerificationFailed, 'Verification failed'));
          }
          return ok(false);
        }
      );

    it('should return error if called on a plain text password', async () => {
      const result = await passwordFromPlain.compare('some text');
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.DomainRuleViolation);
    });

    it('should return ok(true) when comparing correct plain text against a hashed password', async () => {
      const result = await passwordFromHash.compare(validPlainText);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
      expect(verifySpy).toHaveBeenCalledWith(validPlainText, validHashed);
    });

    it('should return ok(false) when comparing incorrect plain text', async () => {
      const result = await passwordFromHash.compare('wrongPassword');
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
      expect(verifySpy).toHaveBeenCalledWith('wrongPassword', validHashed);
    });

    it('should return err when verification util fails', async () => {
      const result = await passwordFromHash.compare('errorPassword');
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(ErrorCode.PasswordVerificationFailed);
      expect(verifySpy).toHaveBeenCalledWith('errorPassword', validHashed);
    });
  });
});
