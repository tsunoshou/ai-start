import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { ValidationError } from '@/shared/errors/validation.error';
import { verifyPassword } from '@/shared/utils/security/password.utils';

import { BaseValueObject } from './base.vo';

// Schema for password validation (minimum 8 characters)
const PASSWORD_SCHEMA = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' });

// Zodスキーマから型を推論
type PasswordValue = z.infer<typeof PASSWORD_SCHEMA>;

/**
 * @class Password
 * @extends BaseValueObject<string>
 * @description Represents a hashed password as a Value Object.
 * Ensures the password meets basic complexity requirements (handled during hashing/creation) and provides comparison.
 * Stores the hashed value.
 *
 * @example
 * // PasswordHash is typically created from a hash result, not directly validated here
 * const hashResult = PasswordHash.create('hashedPassword123');
 * if (hashResult.isOk()) {
 *   const passwordHash = hashResult.value;
 *   const isMatch = await passwordHash.compare('plainPassword123');
 * }
 */
export class PasswordHash extends BaseValueObject<PasswordValue> {
  /**
   * Private constructor to enforce creation via static factory method.
   * @param {string} value - The validated password hash string.
   * @private
   */
  private constructor(value: PasswordValue) {
    super(value);
  }

  /**
   * Creates a PasswordHash instance from a string (assumed to be already hashed).
   * Validates that the hash string is not empty and meets minimum length (as a basic check).
   * Actual password complexity should be enforced before hashing.
   * @param {unknown} hash - The raw password hash input.
   * @returns {Result<PasswordHash, ValidationError>} Ok with PasswordHash instance or Err with ValidationError.
   */
  public static create(hash: unknown): Result<PasswordHash, ValidationError> {
    // Use Zod schema for validation
    const parseResult = PASSWORD_SCHEMA.safeParse(hash);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid password format.';
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: hash,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'PasswordHash' },
        })
      );
    }
    // Use the validated data from Zod
    return ok(new PasswordHash(parseResult.data));
  }

  /**
   * Compares a plain text password against the stored hash.
   * @param {string} plainTextPassword - The plain text password to compare.
   * @returns {Promise<boolean>} True if the password matches the hash, false otherwise.
   */
  async compare(plainTextPassword: string): Promise<boolean> {
    const result = await verifyPassword(plainTextPassword, this.value);
    // Handle potential errors from comparePassword if necessary
    return result.isOk() ? result.value : false;
  }
}
