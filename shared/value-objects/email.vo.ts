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

import { ValidationError } from '../errors/validation.error';

/**
 * Emailアドレスを表す値オブジェクトクラス。
 *
 * 不変性を持ち、常に有効なメールアドレス形式であることを保証します。
 * `create` 静的メソッドを使用してインスタンスを生成してください。
 *
 * @example
 * const emailResult = Email.create('test@example.com');
 * if (emailResult.isOk()) {
 *   const email = emailResult.value;
 *   console.log(email.value); // 'test@example.com'
 * } else {
 *   console.error(emailResult.error.message); // エラーメッセージ
 * }
 *
 * const invalidResult = Email.create('invalid-email');
 * console.log(invalidResult.isErr()); // true
 */
export class Email {
  private readonly _value: string;

  // Revert to the more complex regex, ensuring correct literal syntax
  private static readonly emailRegex =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  /**
   * Emailクラスのインスタンスをプライベートに生成します。
   * バリデーションは `create` メソッドで行うため、ここでは代入のみ行います。
   * @param {string} value - メールアドレス文字列。
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Emailアドレス文字列の形式を検証します。
   * @param {string} value - 検証するメールアドレス文字列。
   * @returns {boolean} 有効な形式であれば true、そうでなければ false。
   */
  private static isValid(value: string): boolean {
    if (!value) {
      return false;
    }
    return Email.emailRegex.test(value);
  }

  /**
   * Emailインスタンスを生成するための静的ファクトリメソッド。
   * 入力文字列のバリデーションを行い、成功すれば Result.Ok を、失敗すれば Result.Err を返します。
   *
   * @param {string} value - メールアドレス文字列。
   * @returns {Result<Email, ValidationError>} 生成結果。成功時はEmailインスタンス、失敗時はValidationErrorを含むResult。
   */
  public static create(value: string): Result<Email, ValidationError> {
    // create の引数で null や undefined が来るケースも考慮 (zod の string() は undefined を許容しないが、直接呼ばれる場合を想定)
    if (value === null || value === undefined) {
      return err(
        new ValidationError('Input cannot be null or undefined.', {
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Email' },
        })
      );
    }
    // 型ガード: 文字列以外はエラー（実際には上記のチェックでほぼカバーされるが念のため）
    if (typeof value !== 'string') {
      return err(
        new ValidationError('Input must be a string.', {
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Email' },
        })
      );
    }

    const trimmedValue = value.trim();

    if (!Email.isValid(trimmedValue)) {
      const errorMessage =
        trimmedValue === '' // 空文字列の場合も明確なエラーメッセージ
          ? 'Email cannot be empty.'
          : `Invalid email format: ${value}`; // 元の値をエラーメッセージに含める
      return err(
        new ValidationError(errorMessage, {
          value: value, // 元の値を記録
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'Email' },
        })
      );
    }
    return ok(new Email(trimmedValue));
  }

  /**
   * Emailアドレスの文字列表現を取得します。
   * @returns {string} メールアドレス文字列。
   */
  get value(): string {
    return this._value;
  }

  /**
   * 他のEmailインスタンスと値が等しいかを比較します。
   * @param {Email} other - 比較対象のEmailインスタンス。
   * @returns {boolean} 値が等しければ true、そうでなければ false。
   */
  public equals(other: Email): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this._value === other.value;
  }
}
