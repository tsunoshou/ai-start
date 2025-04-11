/**
 * @file ユーザーIDを表す値オブジェクトのクラス定義
 * @description ユーザーエンティティを一意に識別するための UUID 形式のID。
 * 値オブジェクトとして実装し、不変性とバリデーションを保証します。
 * 詳細は docs/05_type_definitions.md を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05 // TODO: Update date
 * @version 2.0.0 // Updated to class-based VO
 */

import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { BaseId } from '@core/shared/base/domain/value-objects/base-id.vo';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { AppError } from '@core/shared/errors/app.error';
import { ValidationError } from '@core/shared/errors/validation.error';

// UUID v4 schema for validation
const UUID_SCHEMA = z.string().uuid({ message: 'Invalid UUID v4 format for UserId.' });

/**
 * @class UserId
 * @extends BaseId<string>
 * @description Represents the unique identifier for a User entity.
 * Ensures the ID is a valid UUID v4 string.
 *
 * @example
 * // Generate a new UserId
 * const newIdResult = UserId.generate();
 * if (newIdResult.isOk()) {
 *   const userId = newIdResult.value;
 *   console.log(userId.value); // Outputs the UUID string
 * }
 *
 * @example
 * // Create a UserId from an existing valid UUID string
 * const existingIdResult = UserId.create('123e4567-e89b-12d3-a456-426614174000');
 * if (existingIdResult.isOk()) {
 *   const userId = existingIdResult.value;
 *   console.log(userId.equals(userId)); // true
 * } else {
 *   console.error(existingIdResult.error);
 * }
 *
 * @example
 * // Attempt to create a UserId from an invalid string
 * const invalidIdResult = UserId.create('invalid-uuid');
 * if (invalidIdResult.isErr()) {
 *   console.error(invalidIdResult.error.message); // Outputs validation error message
 * }
 */
export class UserId extends BaseId<string> {
  /**
   * Private constructor to enforce creation via static factory methods.
   * @param {string} value - The UUID string value.
   * @private
   */
  private constructor(value: string) {
    super(value);
  }

  /**
   * Creates a UserId instance from a string.
   * Validates that the string is a valid UUID v4.
   * @param {string} id - The UUID string.
   * @returns {Result<UserId, ValidationError>} Ok with UserId instance or Err with ValidationError.
   */
  public static create(id: string): Result<UserId, ValidationError> {
    const validationResult = UUID_SCHEMA.safeParse(id);
    if (!validationResult.success) {
      // Use the first error message from Zod
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid UserId format.';
      return err(
        new ValidationError(errorMessage, {
          cause: validationResult.error,
          value: id,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'UserId' },
        })
      );
    }
    return ok(new UserId(validationResult.data));
  }

  /**
   * Generates a new UserId with a v4 UUID.
   * @returns {Result<UserId, AppError>} Ok with the new UserId instance, or Err if UUID generation fails (unlikely).
   */
  public static generate(): Result<UserId, AppError> {
    try {
      const newUuid = uuidv4();
      // Assuming generateUUID always returns a valid UUID, bypass create validation for efficiency
      return ok(new UserId(newUuid));
    } catch (error) {
      // Handle potential errors during UUID generation, though standard libraries should be reliable
      return err(
        new AppError(ErrorCode.InternalServerError, 'Failed to generate new UserId', {
          cause: error instanceof Error ? error : new Error(String(error)),
        })
      );
    }
  }
}
