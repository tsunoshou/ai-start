import { BaseError, BaseErrorOptions } from './base.error';

/**
 * @class InfrastructureError
 * @extends BaseError
 * @description インフラストラクチャ層（データベース、外部API、ネットワークなど）で発生したエラーを示すためのクラス。
 * 通常、より具体的なエラー（例: DatabaseError, NetworkError）を `cause` としてラップするために使用される。
 *
 * @example
 * try {
 *   // DB操作
 *   await db.query('...');
 * } catch (dbError) {
 *   throw new InfrastructureError('Database operation failed', { cause: dbError });
 * }
 */
export class InfrastructureError extends BaseError {
  /**
   * InfrastructureError の新しいインスタンスを作成します。
   * エラーコードは汎用的な 'INFRASTRUCTURE_ERROR' を使用します。
   * @param {string} message - エラーメッセージ。
   * @param {BaseErrorOptions} [options] - 追加オプション（cause、metadata）。
   */
  constructor(message: string, options?: BaseErrorOptions) {
    // BaseError のコンストラクタを呼び出し、汎用的なコードを設定
    super('INFRASTRUCTURE_ERROR', message, options);
    this.name = 'InfrastructureError'; // エラー名を設定

    // プロトタイプチェーンとスタックトレースは BaseError で設定済み
  }
}
