import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { ValidationError } from '@core/shared/errors/validation.error.ts';
import { BaseValueObject } from '@core/shared/base/domain/value-objects/base.vo.ts';

// Schema for user name validation (1 to 50 characters)
const USER_NAME_SCHEMA = z
  .string()
  .trim()
  .min(1, { message: 'User name cannot be empty.' })
  .max(50, { message: 'User name must be 50 characters or less.' });

// Zodスキーマから型を推論
type UserNameValue = z.infer<typeof USER_NAME_SCHEMA>;

/**
 * @class UserName
 * @extends BaseValueObject<string>
 * @description Represents the user's display name as a Value Object.
 * Ensures the name meets length constraints.
 *
 * @example
 * const nameResult = UserName.create(' Valid Name ');
 * if (nameResult.isOk()) {
 *   console.log(nameResult.value.value); // 'Valid Name'
 * }
 */
export class UserName extends BaseValueObject<UserNameValue> {
  /**
   * Private constructor to enforce creation via static factory method.
   * @param {string} value - The validated user name string.
   * @private
   */
  private constructor(value: UserNameValue) {
    super(value);
  }

  /**
   * Creates a UserName instance from a string.
   * Validates that the string meets the length constraints (1-50 characters after trimming).
   * @param {unknown} name - The raw user name input.
   * @returns {Result<UserName, ValidationError>} Ok with UserName instance or Err with ValidationError.
   */
  public static create(name: unknown): Result<UserName, ValidationError> {
    // zod スキーマでバリデーション
    const parseResult = USER_NAME_SCHEMA.safeParse(name);

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid user name.';
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: name,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'UserName' },
        })
      );
    }
    // バリデーション成功後、プライベートコンストラクタでインスタンス化
    return ok(new UserName(parseResult.data));
  }

  // equals メソッドは BaseValueObject から継承されるため、ここでは不要
  /*
  public equals(other: UserName): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
  */
}
