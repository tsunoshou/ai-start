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

import { ValidationError } from '../errors/validation.error';

/**
 * ISO 8601形式の日時文字列を表す値オブジェクトクラス。
 *
 * 不変性を持ち、常に有効なISO 8601形式（例: '2023-10-27T10:00:00Z'）であることを保証します。
 * `create` 静的メソッドを使用してインスタンスを生成してください。
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
export class DateTimeString {
  private readonly _value: string;

  /** ISO 8601形式のおおよそのパターン (厳密ではないが一般的な形式をカバー) */
  private static readonly iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

  /**
   * DateTimeStringクラスのインスタンスをプライベートに生成します。
   * @param {string} value - ISO 8601形式の日時文字列。
   */
  private constructor(value: string) {
    this._value = value;
  }

  /**
   * 文字列が有効なISO 8601形式かを検証します。
   * @param {string} value - 検証する文字列。
   * @returns {boolean} 有効な形式であれば true、そうでなければ false。
   */
  private static isValid(value: string): boolean {
    if (!value) {
      return false;
    }
    // Regexでの簡易チェック
    if (!DateTimeString.iso8601Regex.test(value)) {
      return false;
    }
    // Dateオブジェクトでのパース可否チェック
    try {
      const date = new Date(value);
      // getTime() が NaN でないことのみを確認する (toISOString()との比較は削除)
      // オフセット付き文字列も Date オブジェクトに変換できれば有効とみなす
      return !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  }

  /**
   * DateTimeStringインスタンスを生成するための静的ファクトリメソッド。
   * 入力文字列のバリデーションを行い、成功すれば Result.Ok を、失敗すれば Result.Err を返します。
   *
   * @param {unknown} value - ISO 8601形式の可能性がある入力値。
   * @returns {Result<DateTimeString, ValidationError>} 生成結果。
   */
  public static create(value: unknown): Result<DateTimeString, ValidationError> {
    // 型ガード: 文字列以外はエラー
    if (typeof value !== 'string') {
      return err(
        new ValidationError('Input must be a string.', {
          value: value,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'DateTimeString' },
        })
      );
    }

    const trimmedValue = value.trim();
    if (!DateTimeString.isValid(trimmedValue)) {
      return err(
        new ValidationError(`Invalid ISO 8601 DateTime format: ${value}`, {
          value: trimmedValue,
          validationTarget: 'ValueObject',
          metadata: { valueObjectName: 'DateTimeString' },
        })
      );
    }
    return ok(new DateTimeString(trimmedValue));
  }

  /**
   * 現在時刻から DateTimeString インスタンスを生成します。
   * @returns {DateTimeString} 現在時刻を表すDateTimeStringインスタンス。
   */
  public static now(): DateTimeString {
    // `new Date().toISOString()` は常に有効な形式なので、直接コンストラクタを呼ぶ
    return new DateTimeString(new Date().toISOString());
  }

  /**
   * ISO 8601形式の日時文字列を取得します。
   * @returns {string} ISO 8601形式の日時文字列。
   */
  get value(): string {
    return this._value;
  }

  /**
   * 保持している日時文字列をDateオブジェクトに変換して返します。
   * @returns {Date} 対応するDateオブジェクト。
   */
  public toDate(): Date {
    return new Date(this._value);
  }

  /**
   * 他のDateTimeStringインスタンスと値が等しいかを比較します。
   * @param {DateTimeString} other - 比較対象のDateTimeStringインスタンス。
   * @returns {boolean} 値が等しければ true、そうでなければ false。
   */
  public equals(other: DateTimeString): boolean {
    return this._value === other.value;
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
