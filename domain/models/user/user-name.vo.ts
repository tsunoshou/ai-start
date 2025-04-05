import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// Schema for user name validation (1 to 50 characters)
const USER_NAME_SCHEMA = z
  .string()
  .trim()
  .min(1, { message: 'User name cannot be empty.' })
  .max(50, { message: 'User name must be 50 characters or less.' });

/**
 * @class UserName
 * @description Represents the user's display name as a Value Object.
 * Ensures the name meets length constraints.
 *
 * @example
 * const nameResult = UserName.create(' Valid Name ');
 * if (nameResult.isOk()) {
 *   console.log(nameResult.value.value); // 'Valid Name'
 * }
 */
export class UserName {
  /**
   * The underlying string value of the user name.
   * @public
   * @readonly
   */
  public readonly value: string;

  /**
   * Private constructor to enforce creation via static factory method.
   * @param {string} value - The validated user name string.
   * @private
   */
  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a UserName instance from a string.
   * Validates that the string meets the length constraints (1-50 characters after trimming).
   * @param {string} name - The user name string.
   * @returns {Result<UserName, BaseError>} Ok with UserName instance or Err with BaseError.
   */
  public static create(name: unknown): Result<UserName, BaseError> {
    const parseResult = USER_NAME_SCHEMA.safeParse(name);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid user name.';
      return err(new BaseError(ErrorCode.ValidationError, errorMessage));
    }
    // Use the validated (and potentially trimmed) data from Zod
    return ok(new UserName(parseResult.data));
  }

  /**
   * Checks if this UserName is equal to another UserName based on their values.
   * @param {UserName} other - The other UserName to compare against.
   * @returns {boolean} True if the names have the same value, false otherwise.
   */
  public equals(other: UserName): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
