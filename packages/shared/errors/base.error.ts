/**
 * @file アプリケーション固有のエラーの基底クラスを定義します。
 */

/**
 * 追加のエラーコンテキスト情報を提供するためのオプション。
 */
export interface BaseErrorOptions {
  /**
   * このエラーを引き起こした元のエラー。
   */
  cause?: unknown;
  /**
   * エラーに関連する追加のメタデータ。
   */
  metadata?: Record<string, unknown>;
}

/**
 * @class BaseError
 * @description アプリケーション全体で使用されるカスタムエラーの基底クラス。
 * 標準の Error クラスを拡張し、エラーコード、原因、メタデータを含む。
 *
 * @property {string} code - エラーを一意に識別するコード。
 * @property {unknown} [cause] - このエラーを引き起こした元のエラー（オプション）。
 * @property {Record<string, unknown>} [metadata] - エラーに関する追加のコンテキスト情報（オプション）。
 *
 * @example
 * \`\`\`typescript
 * import { BaseError } from './base.error';
 *
 * class SpecificError extends BaseError {
 *   constructor(message: string, options?: BaseErrorOptions) {
 *     super('SPECIFIC_ERROR_CODE', message, options);
 *     this.name = 'SpecificError'; // エラー名を設定
 *   }
 * }
 *
 * try {
 *   throw new SpecificError('Something specific went wrong', {
 *     cause: new Error('Original cause'),
 *     metadata: { userId: 'user-123' }
 *   });
 * } catch (error) {
 *   if (error instanceof BaseError) {
 *     console.error(\`Error Code: \${error.code}\`);
 *     console.error(\`Message: \${error.message}\`);
 *     if (error.cause) {
 *       console.error('Cause:', error.cause);
 *     }
 *     if (error.metadata) {
 *       console.error('Metadata:', error.metadata);
 *     }
 *   } else {
 *     console.error('An unexpected error occurred:', error);
 *   }
 * }
 * \`\`\`
 */
export class BaseError extends Error {
  /**
   * エラーを一意に識別するコード。
   * @type {string}
   */
  public readonly code: string;

  /**
   * このエラーを引き起こした元のエラー（オプション）。
   * @type {unknown}
   */
  public override readonly cause?: unknown;

  /**
   * エラーに関する追加のコンテキスト情報（オプション）。
   * キーと値のペアのレコード。
   * @type {Record<string, unknown>}
   */
  public readonly metadata?: Record<string, unknown>;

  /**
   * BaseErrorの新しいインスタンスを作成します。
   * @param {string} code - エラーコード。
   * @param {string} message - エラーメッセージ。
   * @param {BaseErrorOptions} [options] - 追加オプション（cause、metadata）。
   */
  constructor(code: string, message: string, options?: BaseErrorOptions) {
    super(message);
    this.code = code;
    this.cause = options?.cause;
    this.metadata = options?.metadata;

    // 標準のErrorクラスのプロトタイプチェーンを正しく設定
    Object.setPrototypeOf(this, new.target.prototype);

    // V8エンジンなどでスタックトレースをキャプチャ（推奨）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // エラー名を設定（クラス名が望ましい）
    this.name = this.constructor.name;
  }

  /**
   * エラーオブジェクトをJSON表現に変換します（機密情報は含めない）。
   * APIレスポンスなどで使用することを想定。
   * @returns {{ code: string; message: string; name: string; metadata?: Record<string, unknown> }}
   */
  toJSON(): {
    code: string;
    message: string;
    name: string;
    metadata?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      // Cause は通常、内部的な詳細情報を含むため、デフォルトでは含めない
      // Metadata は公開しても安全な情報のみを含むべき
      metadata: this.metadata,
    };
  }
}
