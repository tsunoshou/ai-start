import { describe, it, expect } from 'vitest';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

import { PasswordHash } from '../password-hash.vo';

describe('PasswordHash Value Object', () => {
  const validHash = 'bcrypt_hashed_password_string_example123.abc/def';
  const anotherValidHash = 'another_valid_hash_string_!@#';

  describe('create', () => {
    it('should create a PasswordHash instance for a valid non-empty string', () => {
      const result = PasswordHash.create(validHash);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(PasswordHash);
        expect(result.value.value).toBe(validHash);
      }
    });

    it('should return error for an empty string', () => {
      const result = PasswordHash.create('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
        expect(result.error.message).toContain('Password hash cannot be empty');
      }
    });

    it.each([
      [null, 'null'],
      [undefined, 'undefined'],
      [12345, 'number'],
      [{}, 'object'],
      [[], 'array'],
    ])('should return error for non-string input type (%s)', (invalidInput, _description) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = PasswordHash.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
        // Zod error message for wrong type might be different, checking code is safer
      }
    });
  });

  describe('value getter', () => {
    it('should return the correct hash string', () => {
      const result = PasswordHash.create(validHash);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validHash);
      }
    });
  });

  describe('equals', () => {
    const hash1Result = PasswordHash.create(validHash);
    const hash2Result = PasswordHash.create(validHash);
    const hash3Result = PasswordHash.create(anotherValidHash);

    // Check results before accessing value
    if (hash1Result.isErr() || hash2Result.isErr() || hash3Result.isErr()) {
      throw new Error('Test setup failed: Could not create PasswordHash instances');
    }
    const hash1 = hash1Result.value;
    const hash2 = hash2Result.value;
    const hash3 = hash3Result.value;

    it('should return true for instances with the same value', () => {
      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for instances with different values', () => {
      expect(hash1.equals(hash3)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(hash1.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(hash1.equals(undefined as any)).toBe(false);
    });
  });
});
