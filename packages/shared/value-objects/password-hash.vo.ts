import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { ValidationError } from '@core/shared/errors/validation.error';
import { BaseValueObject } from '@core/shared/base/domain/value-objects/base.vo';

// Schema for password hash validation (minimum 8 characters, as an example constraint)
const PASSWORD_HASH_SCHEMA = z
  .string()
  .min(8, { message: 'Password hash must be at least 8 characters long.' });

// Zodスキーマから型を推論
type PasswordHashValue = z.infer<typeof PASSWORD_HASH_SCHEMA>;

/**
 * @class PasswordHash
 * @extends BaseValueObject<string>
 * @description Represents a hashed password as a Value Object.
 * Ensures the hash string meets basic format constraints (e.g., minimum length).
 * Does not perform hashing or comparison.
 *
 * @example
 * const hashResult = PasswordHash.create('bcrypt_hashed_password_string_longer_than_8');
 * if (hashResult.isOk()) {
 *   console.log(hashResult.value.value);
 * }
 */
export class PasswordHash extends BaseValueObject<PasswordHashValue> {
  /**
   * Private constructor to enforce creation via static factory method.
   * @param {string} value - The validated password hash string.
   * @private
   */
  private constructor(value: PasswordHashValue) {
    super(value);
  }

  /**
   * Creates a PasswordHash instance from a string.
   * Validates that the string is not empty and meets length constraints.
   * @param {unknown} hash - The raw password hash input.
   * @returns {Result<PasswordHash, ValidationError>} Ok with PasswordHash instance or Err with ValidationError.
   */
  public static create(hash: unknown): Result<PasswordHash, ValidationError> {
    const parseResult = PASSWORD_HASH_SCHEMA.safeParse(hash);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid password hash.';
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: hash,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'PasswordHash' },
        })
      );
    }
    return ok(new PasswordHash(parseResult.data));
  }
}
