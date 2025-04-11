import { ok, err, Result } from 'neverthrow';
import { describe, it, expect, vi } from 'vitest';

import { AppError } from '@core/shared/errors/app.error.ts';
import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import { ValidationError } from '@core/shared/errors/validation.error.ts';

import { PasswordHash } from '../password-hash.vo';

// Mock password utils - specifically verifyPassword for compare method
vi.mock('@/shared/utils/security/password.utils', () => ({
  verifyPassword: async (plain: string, hash: string): Promise<Result<boolean, AppError>> => {
    // Simple mock: Check if plain matches the part after 'hashed:'
    if (hash.startsWith('hashed:') && hash === `hashed:${plain}`) {
      return ok(true);
    } else if (plain === 'errorPassword') {
      // Simulate verification error
      return err(new AppError(ErrorCode.PasswordVerificationFailed, 'Mock verification error'));
    }
    return ok(false); // Default to false for mismatch or non-matching hash format
  },
  // hashPassword is not directly used by PasswordHash VO, so mock can be simpler or removed if not needed elsewhere
  hashPassword: async (_plain: string): Promise<Result<string, AppError>> => {
    // This mock isn't directly used by PasswordHash tests but might be needed by other tests
    return ok('mocked_hash_value');
  },
}));

describe('PasswordHash Value Object', () => {
  const validHash = 'hashed:correctPassword123'; // Example valid hash (must be >= 8 chars based on schema)
  const shortHash = 'short'; // < 8 chars
  const anotherValidHash = 'hashed:anotherPassword456'; // Added another valid hash
  // Note: Max length validation might not be relevant for hashes, depends on schema/db

  describe('create static method', () => {
    it('should create a PasswordHash instance for a valid hash string', () => {
      const result = PasswordHash.create(validHash);
      expect(result.isOk()).toBe(true);
      const passwordHash = result._unsafeUnwrap();
      expect(passwordHash).toBeInstanceOf(PasswordHash);
      expect(passwordHash.value).toBe(validHash);
    });

    it('should return an error for a hash string that is too short (based on schema)', () => {
      const result = PasswordHash.create(shortHash);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      // Message depends on the Zod schema in password-hash.vo.ts
      expect(error.message).toContain('Password hash must be at least 8 characters long.');
    });

    // Add test for max length if applicable based on schema/requirements

    it.each([
      [null],
      [undefined],
      [123],
      [''], // Empty string is also too short
    ])('should return an error for invalid input type or empty string: %s', (invalidInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = PasswordHash.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
    });
  });

  describe('value getter', () => {
    it('should return the stored hash value', () => {
      const result = PasswordHash.create(validHash);
      expect(result.isOk()).toBe(true);
      const passwordHash = result._unsafeUnwrap();
      expect(passwordHash.value).toBe(validHash);
    });
  });

  describe('equals', () => {
    const hash1Result = PasswordHash.create(validHash);
    const hash2Result = PasswordHash.create(validHash);
    const hash3Result = PasswordHash.create(anotherValidHash); // Use anotherValidHash instead of shortHash

    // Check results before accessing value
    if (hash1Result.isErr() || hash2Result.isErr() || hash3Result.isErr()) {
      // Now hash3Result should be Ok
      throw new Error('Test setup failed: Could not create PasswordHash instances');
    }
    const hash1 = hash1Result.value;
    const hash2 = hash2Result.value;
    const hash3 = hash3Result.value;

    it('should return true for the same PasswordHash instance', () => {
      expect(hash1.equals(hash1)).toBe(true);
    });

    it('should return true for different instances with the same hash value', () => {
      expect(hash1.equals(hash2)).toBe(true);
    });

    it('should return false for different instances with different hash values', () => {
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
