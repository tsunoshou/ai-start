/**
 * @file Emailアドレスを表す値オブジェクト
 * @description メールアドレスの形式を検証し、不変性を保証します。
 * 詳細は docs/05_type_definitions.md の「値オブジェクト vs プリミティブ型」を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { Result, ok, err } from 'neverthrow';

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
   * @returns {Result<Email, Error>} 生成結果。成功時はEmailインスタンス、失敗時はErrorを含むResult。
   */
  public static create(value: string): Result<Email, Error> {
    const trimmedValue = typeof value === 'string' ? value.trim() : '';

    if (!Email.isValid(trimmedValue)) {
      const errorMessage =
        !trimmedValue && typeof value === 'string'
          ? 'Email cannot be empty or just whitespace.'
          : `Invalid email format: ${value}`;
      return err(new Error(errorMessage));
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
