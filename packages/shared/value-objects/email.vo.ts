/**
 * @file Emailアドレスを表す値オブジェクト
 * @description メールアドレスの形式を検証し、不変性を保証します。
 * 詳細は docs/05_type_definitions.md の「値オブジェクト vs プリミティブ型」を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.1.0
 */

import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { ValidationError } from '@core/shared/errors/validation.error';

import { BaseValueObject } from '@core/shared/base/domain/value-objects/base.vo'; // BaseValueObject をインポート

// Schema for email validation
const EMAIL_SCHEMA = z
  .string()
  .trim()
  .email({ message: 'Invalid email format.' })
  .max(255, { message: 'Email must be 255 characters or less.' }); // Add max length

// Zodスキーマから型を推論
type EmailValue = z.infer<typeof EMAIL_SCHEMA>;

/**
 * @class Email
 * @extends BaseValueObject<string>
 * @description Represents an email address as a Value Object.
 * Ensures the email is valid and normalized (lowercase).
 *
 * @example
 * const emailResult = Email.create(' Test@Example.COM ');
 * if (emailResult.isOk()) {
 *   console.log(emailResult.value.value); // 'test@example.com'
 * }
 */
export class Email extends BaseValueObject<EmailValue> {
  /**
   * Private constructor to enforce creation via static factory method.
   * Normalizes the email to lowercase.
   * @param {string} value - The validated email string.
   * @private
   */
  private constructor(value: EmailValue) {
    // 値を小文字に正規化して保存
    super(value.toLowerCase());
  }

  /**
   * Creates an Email instance from a string.
   * Validates that the string is a valid email format and meets length constraints.
   * @param {unknown} email - The raw email input.
   * @returns {Result<Email, ValidationError>} Ok with Email instance or Err with ValidationError.
   */
  public static create(email: unknown): Result<Email, ValidationError> {
    // zod スキーマでバリデーション
    const parseResult = EMAIL_SCHEMA.safeParse(email);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors[0]?.message || 'Invalid email.';
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: email,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Email' },
        })
      );
    }
    // Use the validated data from Zod
    // バリデーション成功後、プライベートコンストラクタでインスタンス化 (小文字化も行われる)
    return ok(new Email(parseResult.data));
  }

  // equals メソッドは BaseValueObject から継承されるため、ここでは不要
  /*
  public equals(other: Email): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
  */
}
