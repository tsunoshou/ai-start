/**
 * @file バリデーションエラーを表すクラスを定義します。
 */

import { AppError } from './app.error';
import type { BaseErrorOptions } from './base.error';
import { ErrorCode } from './error-code.enum';

/**
 * @class ValidationError
 * @extends AppError
 * @description 入力値やパラメータ、値オブジェクトなどのバリデーション失敗を表すエラークラス。
 * エラーコードは常に `ErrorCode.ValidationError` となります。
 *
 * @param {string} message - エラーメッセージ。
 * @param {BaseErrorOptions & { field?: string; value?: unknown; validationTarget?: string }} [options] - 追加オプション。
 *        - `field`: バリデーションに失敗したフィールド名（オプション）。
 *        - `value`: バリデーションに失敗した値（オプション）。
 *        - `validationTarget`: バリデーション対象の種類（例: 'ApiInput', 'ValueObject'）（オプション）。
 *        - `cause`: 元となったエラー（オプション）。
 *        - `metadata`: その他のメタデータ（オプション）。
 *
 * @example
 * ```typescript
 * // API入力のバリデーションエラー
 * throw new ValidationError('Invalid email format', {
 *   field: 'email',
 *   value: 'invalid-email',
 *   validationTarget: 'ApiInput'
 * });
 *
 * // 値オブジェクトのバリデーションエラー
 * try {
 *   Email.create('invalid');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *      // エラー処理
 *   }
 * }
 *
 * // VOのcreateメソッド内での使用例
 * public static create(value: string): Result<Email, ValidationError> {
 *   const validation = Email.schema.safeParse(value);
 *   if (!validation.success) {
 *     return err(new ValidationError(`Invalid email: ${validation.error.issues[0]?.message ?? 'unknown issue'}`, {
 *       cause: validation.error,
 *       value: value,
 *       validationTarget: 'ValueObject',
 *       metadata: { valueObjectName: 'Email' } // 必要に応じて詳細情報を追加
 *     }));
 *   }
 *   return ok(new Email(validation.data));
 * }
 * ```
 */
export class ValidationError extends AppError {
  /**
   * ValidationError の新しいインスタンスを作成します。
   * エラーコードは常に `ErrorCode.ValidationError` が設定されます。
   * @param {string} message - エラーメッセージ。
   * @param {BaseErrorOptions & { field?: string; value?: unknown; validationTarget?: string }} [options] - 追加オプション。
   */
  constructor(
    message: string,
    options?: BaseErrorOptions & { field?: string; value?: unknown; validationTarget?: string }
  ) {
    const { field, value, validationTarget, cause, metadata } = options ?? {};
    const errorMetadata = {
      ...(field && { field }), // field があれば追加
      ...(value !== undefined && { value }), // value があれば追加 (null や 0 も考慮)
      ...(validationTarget && { validationTarget }), // validationTarget があれば追加
      ...metadata, // 既存の metadata もマージ
    };

    // AppError のコンストラクタを呼び出し、エラーコードを ValidationError に固定
    super(ErrorCode.ValidationError, message, { cause, metadata: errorMetadata });

    // エラー名を ValidationError に設定
    this.name = 'ValidationError';
  }
}
