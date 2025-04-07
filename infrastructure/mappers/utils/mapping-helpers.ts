import { Result } from 'neverthrow';

/**
 * 値オブジェクトをマッパーインターフェースに変換するヘルパー関数
 *
 * @param valueObject - 値オブジェクトのクラス（createメソッドを持つ）
 * @returns マッパーインターフェースに適合する形式に変換された値オブジェクト
 */
export function asValueObjectMapper<T, R>(valueObject: {
  create: (value: T) => Result<R, Error>;
}): { create: (value: unknown) => Result<unknown, Error> } {
  return valueObject as unknown as { create: (value: unknown) => Result<unknown, Error> };
}

/**
 * 値を特定の型にキャストするヘルパー関数
 *
 * @param value - キャストする値
 * @returns 指定した型にキャストされた値
 */
export function asType<T>(value: unknown): T {
  return value as T;
}

/**
 * 日付値を文字列に変換するヘルパー関数
 *
 * @param value - 日付オブジェクトまたは文字列
 * @returns ISO形式の日付文字列
 */
export function toISOString(value: unknown): string {
  return value instanceof Date
    ? value.toISOString()
    : typeof value === 'string'
      ? value
      : String(value);
}
