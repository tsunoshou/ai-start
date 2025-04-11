/**
 * @file ISO 8601形式の日時文字列を表す値オブジェクト
 * @description 日時文字列の形式検証と不変性を保証します。
 * 内部的には文字列として保持しますが、Dateオブジェクトへの変換メソッドを提供します。
 * 詳細は docs/05_type_definitions.md の「値オブジェクト vs プリミティブ型」を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.1.0
 */

import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';

import { ValidationError } from '../errors/validation.error';

import { BaseValueObject } from '@core/shared/base/domain/value-objects/base.vo';

// Zod schema for ISO 8601 datetime string validation
// .datetime() includes offset validation by default.
const DATETIME_STRING_SCHEMA = z.string().datetime({
  message: 'Invalid ISO 8601 DateTime format.',
  // precision: 3, // Optional: enforce millisecond precision if needed
  offset: true, // Optional: require timezone offset like 'Z' or '+/-HH:mm'
});

// Zodスキーマから型を推論
type DateTimeStringValue = z.infer<typeof DATETIME_STRING_SCHEMA>;

/**
 * ISO 8601形式の日時文字列を表す値オブジェクトクラス。
 *
 * 不変性を持ち、常に有効なISO 8601形式（例: '2023-10-27T10:00:00Z'）であることを保証します。
 * `create` 静的メソッドを使用してインスタンスを生成してください。
 *
 * @extends BaseValueObject<string>
 *
 * @example
 * const now = new Date();
 * const dtStringResult = DateTimeString.create(now.toISOString());
 * if (dtStringResult.isOk()) {
 *   const dtString = dtStringResult.value;
 *   console.log(dtString.value); // ISO 8601形式の文字列
 *   console.log(dtString.toDate().toLocaleTimeString()); // Dateオブジェクトに変換して使用
 * } else {
 *   console.error(dtStringResult.error.message);
 * }
 *
 * const fromStringResult = DateTimeString.create('2025-04-05T12:34:56.789Z');
 * console.log(fromStringResult.isOk()); // true
 *
 * const invalidResult = DateTimeString.create('invalid-date-string');
 * console.log(invalidResult.isErr()); // true
 */
export class DateTimeString extends BaseValueObject<DateTimeStringValue> {
  /**
   * DateTimeStringクラスのインスタンスをプライベートに生成します。
   * @param {string} value - バリデーション済みのISO 8601形式の日時文字列。
   * @private
   */
  private constructor(value: DateTimeStringValue) {
    super(value);
  }

  /**
   * DateTimeStringインスタンスを生成するための静的ファクトリメソッド。
   * 入力文字列のバリデーションを行い、成功すれば Result.Ok を、失敗すれば Result.Err を返します。
   *
   * @param {unknown} value - ISO 8601形式の可能性がある入力値。
   * @returns {Result<DateTimeString, ValidationError>} 生成結果。
   */
  public static create(value: unknown): Result<DateTimeString, ValidationError> {
    const parseResult = DATETIME_STRING_SCHEMA.safeParse(value);

    if (!parseResult.success) {
      // Zodのエラーメッセージを使用
      const errorMessage =
        parseResult.error.errors[0]?.message || 'Invalid ISO 8601 DateTime format.';
      // Add detailed logging for the Zod error
      console.error('[DateTimeString.create] Zod validation failed:', {
        inputValue: value,
        zodError: parseResult.error.format(), // Log formatted Zod error
      });
      return err(
        new ValidationError(errorMessage, {
          cause: parseResult.error,
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'DateTimeString' },
        })
      );
    }
    // Use validated data and private constructor
    return ok(new DateTimeString(parseResult.data));
  }

  /**
   * 現在時刻から DateTimeString インスタンスを生成します。
   * @returns {DateTimeString} 現在時刻を表すDateTimeStringインスタンス。
   */
  public static now(): DateTimeString {
    const nowIso = new Date().toISOString();
    const result = DateTimeString.create(nowIso);
    // This should ideally never fail if Date.toISOString() is correct
    if (result.isErr()) {
      // Log unexpected error or handle appropriately
      console.error('Unexpected error creating DateTimeString from Date.now()', result.error);
      // Instead of throwing, return the error result directly
      // This might require changing the return type of now() to Result<DateTimeString, ValidationError>
      // For now, let's assume it still throws for simplicity in demonstrating the change,
      // but returning the Result is cleaner.
      // return result;
      // Revert to throw to keep signature, but log properly.
      throw new Error(`Failed to create DateTimeString from Date.now(): ${result.error.message}`);
    }
    return result.value;
  }

  /**
   * 保持している日時文字列をDateオブジェクトに変換して返します。
   * @returns {Date} 対応するDateオブジェクト。
   */
  public toDate(): Date {
    return new Date(this.value);
  }

  /**
   * 他のDateTimeStringインスタンスとの時間的な前後関係を比較します。
   * @param {DateTimeString} other - 比較対象のDateTimeStringインスタンス。
   * @returns {number} このインスタンスがotherより過去なら負の値、未来なら正の値、同時刻なら0。
   */
  public compare(other: DateTimeString): number {
    const date1 = this.toDate().getTime();
    const date2 = other.toDate().getTime();
    return date1 - date2;
  }
}
