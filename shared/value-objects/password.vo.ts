import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { ValidationError } from '@/shared/errors/validation.error';
import { verifyPassword } from '@/shared/utils/security/password.utils';

import { BaseValueObject } from './base.vo';
import { PasswordHash } from './password-hash.vo'; // Import PasswordHash for fromHash

// Schema for plain text password validation (minimum 8 characters)
const PASSWORD_SCHEMA = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' });

// Zodスキーマから型を推論
type PasswordValue = z.infer<typeof PASSWORD_SCHEMA>;

/**
 * @class Password
 * @extends BaseValueObject<string>
 * @description Represents a user's password, which can be either plain text or a hash.
 * Provides methods to create from plain text or a hash, check if hashed, and compare.
 *
 * @example
 * // Create from plain text
 * const plainPasswordResult = Password.create('MySecureP@ssw0rd');
 *
 * // Create from a hash (assuming hashVo is a valid PasswordHash instance)
 * const passwordFromHashResult = Password.fromHash(hashVo);
 *
 * // Check if hashed and compare
 * if (passwordFromHashResult.isOk()) {
 *   const password = passwordFromHashResult.value;
 *   if (password.isHashed()) {
 *     const isMatch = await password.compare('MySecureP@ssw0rd');
 *   }
 * }
 */
export class Password extends BaseValueObject<PasswordValue> {
  private readonly _isHashed: boolean;

  /**
   * Private constructor to enforce creation via static factory methods.
   * @param {string} value - The password value (plain text or hash).
   * @param {boolean} isHashed - Flag indicating if the value is a hash.
   * @private
   */
  private constructor(value: PasswordValue, isHashed: boolean) {
    super(value);
    this._isHashed = isHashed;
  }

  /**
   * Creates a Password instance from plain text.
   * Validates that the plain text password meets the minimum length requirement.
   * @param {unknown} plainText - The raw plain text password input.
   * @returns {Result<Password, ValidationError>} Ok with Password instance or Err with ValidationError.
   */
  public static create(plainText: unknown): Result<Password, ValidationError> {
    const parseResult = PASSWORD_SCHEMA.safeParse(plainText);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid password format.';
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: plainText,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Password' },
        })
      );
    }
    return ok(new Password(parseResult.data, false)); // isHashed is false for plain text
  }

  /**
   * Creates a Password instance from an existing PasswordHash value object.
   * @param {PasswordHash} hashVo - The PasswordHash value object.
   * @returns {Result<Password, AppError>} Ok with Password instance representing the hash.
   */
  public static fromHash(hashVo: PasswordHash): Result<Password, AppError> {
    // Assuming hashVo.value is already validated by PasswordHash.create
    // We might still want to double-check length here if Password schema applies to hash too
    const parseResult = PASSWORD_SCHEMA.safeParse(hashVo.value);
    if (!parseResult.success) {
      return err(
        new AppError(
          ErrorCode.InternalServerError,
          'Invalid hash format encountered in Password.fromHash'
        )
      );
    }
    return ok(new Password(parseResult.data, true)); // isHashed is true
  }

  /**
   * Checks if the stored password value is a hash.
   * @returns {boolean} True if the password value represents a hash, false otherwise.
   */
  public isHashed(): boolean {
    return this._isHashed;
  }

  /**
   * Compares a plain text password against the stored value (if it's a hash).
   * @param {string} plainTextPassword - The plain text password to compare.
   * @returns {Promise<Result<boolean, AppError>>} Ok(true) if match, Ok(false) if no match, Err if comparison fails or if the stored value is not a hash.
   */
  async compare(plainTextPassword: string): Promise<Result<boolean, AppError>> {
    if (!this.isHashed()) {
      return err(
        new AppError(
          ErrorCode.DomainRuleViolation, // Use appropriate error code
          'Cannot compare a plain text password using the compare method.'
        )
      );
    }
    // this.value is the hash when isHashed() is true
    const result = await verifyPassword(plainTextPassword, this.value);
    return result; // Propagate the result (Ok<boolean> or Err<AppError>)
  }
}
