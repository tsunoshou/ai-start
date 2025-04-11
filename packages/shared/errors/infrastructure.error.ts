import { AppError } from './app.error';
import { BaseErrorOptions } from './base.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';

/**
 * @class InfrastructureError
 * @extends AppError
 * @description インフラストラクチャ層（データベース、外部API、ネットワークなど）で発生したエラーを示すためのクラス。
 * AppError の一種として扱われる。
 *
 * @example
 * try {
 *   // DB操作
 *   await db.query('...');
 * } catch (dbError) {
 *   // ErrorCode.DatabaseError を指定して InfrastructureError をスロー
 *   throw new InfrastructureError(ErrorCode.DatabaseError, 'Database operation failed', { cause: dbError });
 * }
 */
export class InfrastructureError extends AppError {
  /**
   * InfrastructureError の新しいインスタンスを作成します。
   * @param {ErrorCode} code - ErrorCode Enum のメンバー（例: ErrorCode.DatabaseError）。
   * @param {string} message - エラーメッセージ。
   * @param {BaseErrorOptions} [options] - 追加オプション（cause、metadata）。
   */
  constructor(code: ErrorCode, message: string, options?: BaseErrorOptions) {
    // AppError のコンストラクタを呼び出す
    super(code, message, options);
    this.name = 'InfrastructureError'; // エラー名を上書き設定

    // プロトタイプチェーンとスタックトレースは BaseError (経由で AppError) で設定済み
  }
}
