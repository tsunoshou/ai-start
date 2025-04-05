import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// Schema for password hash validation (non-empty string)
// In a real app, might add length checks or format checks depending on the hashing algorithm output
const PASSWORD_HASH_SCHEMA = z.string().min(1, { message: 'Password hash cannot be empty.' });

/**
 * @class PasswordHash
 * @description Represents a hashed password as a Value Object.
 * Ensures the hash string is not empty. Does not perform hashing or comparison.
 *
 * @example
 * const hashResult = PasswordHash.create('bcrypt_hashed_password_string');
 * if (hashResult.isOk()) {
 *   console.log(hashResult.value.value); // 'bcrypt_hashed_password_string'
 * }
 */
export class PasswordHash {
  /**
   * The underlying string value of the password hash.
   * @public
   * @readonly
   */
  public readonly value: string;

  /**
   * Private constructor to enforce creation via static factory method.
   * @param {string} value - The validated password hash string.
   * @private
   */
  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a PasswordHash instance from a string.
   * Validates that the string is not empty.
   * @param {string} hash - The password hash string.
   * @returns {Result<PasswordHash, BaseError>} Ok with PasswordHash instance or Err with BaseError.
   */
  public static create(hash: unknown): Result<PasswordHash, BaseError> {
    const parseResult = PASSWORD_HASH_SCHEMA.safeParse(hash);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid password hash.';
      return err(new BaseError(ErrorCode.ValidationError, errorMessage));
    }
    return ok(new PasswordHash(parseResult.data));
  }

  /**
   * Checks if this PasswordHash is equal to another PasswordHash based on their values.
   * Note: Direct string comparison is usually sufficient for hashed passwords.
   * @param {PasswordHash} other - The other PasswordHash to compare against.
   * @returns {boolean} True if the hashes have the same value, false otherwise.
   */
  public equals(other: PasswordHash): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
