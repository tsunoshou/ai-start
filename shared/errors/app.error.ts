/**
 * @file アプリケーション固有のエラークラスを定義します。
 */

import { BaseError, BaseErrorOptions } from './base.error';
import { ErrorCode } from './error-code.enum'; // ErrorCodeをインポート

/**
 * BaseErrorOptions を再エクスポート（オプション）-> 不要になるためコメントアウト
 * AppError のコンストラクタで型ヒントとして利用しやすくするため。
 */
// export type { BaseErrorOptions } from './base.error';

/**
 * @class AppError
 * @extends BaseError
 * @description アプリケーション全体で使用される標準的なエラークラス。
 * BaseError を継承し、ErrorCode Enum を使用してエラーコードを指定する。
 *
 * @property {ErrorCode} code - エラーコード Enum のメンバー。
 * @property {Record<string, unknown>} [metadata] - エラーに関する追加コンテキスト情報（オプション）。
 *
 * @example
 * \`\`\`typescript
 * import { AppError, ErrorCode, BaseErrorOptions } from './app.error';
 *
 * function processUserData(userId: string) {
 *   if (!isValidUserId(userId)) {
 *     // ErrorCode を指定して AppError をスロー
 *     throw new AppError(ErrorCode.ValidationError, 'Invalid user ID format');
 *   }
 *   // ...処理...
 *   try {
 *     // 何らかのDB操作でエラーが発生したとする
 *     throw new Error('DB connection failed');
 *   } catch (dbError) {
 *     // 元のエラーを cause として AppError をスロー
 *     throw new AppError(
 *       ErrorCode.DatabaseError,
 *       'Failed to access user data',
 *       { cause: dbError, metadata: { userId } }
 *     );
 *   }
 * }
 *
 * try {
 *   processUserData('invalid-id');
 * } catch (error) {
 *   if (error instanceof AppError) {
 *     console.error(\`AppError Code: \${error.code}\`); // ErrorCode.ValidationError
 *     console.error(\`Message: \${error.message}\`); // 'Invalid user ID format'
 *     if (error.metadata) {
 *       console.error('Metadata:', error.metadata); // デバッグ情報を出力
 *     }
 *     // エラーコードに応じた処理
 *     if (error.code === ErrorCode.DatabaseError) {
 *       // DBエラー固有の処理
 *     }
 *   } else if (error instanceof BaseError) {
 *       // BaseError だが AppError ではない場合 (通常は AppError を使うべき)
 *       console.error(\`BaseError Code: \${error.code}\`);
 *   } else {
 *     console.error('An unexpected error occurred:', error);
 *   }
 * }
 * \`\`\`
 */
export class AppError extends BaseError {
  /**
   * エラーコード Enum のメンバー。
   * BaseError の code プロパティを ErrorCode 型でオーバーライド（型を具体化）。
   * @type {ErrorCode}
   */
  public override readonly code: ErrorCode;

  /**
   * AppError の新しいインスタンスを作成します。
   * @param {ErrorCode} code - ErrorCode Enum のメンバー。
   * @param {string} message - エラーメッセージ。
   * @param {BaseErrorOptions} [options] - 追加オプション（cause、metadata）。
   */
  constructor(code: ErrorCode, message: string, options?: BaseErrorOptions) {
    // BaseError のコンストラクタを呼び出す
    super(code, message, options);
    this.code = code; // ErrorCode 型で code を設定

    // プロトタイプチェーンとスタックトレースは BaseError で設定済み
    // エラー名も BaseError で設定済み (デフォルトは 'AppError')
    // 必要であればここで再設定も可能: this.name = 'SpecificAppError';
  }

  /**
   * エラーにメタデータを追加します。既存のメタデータとマージします。
   * @param {Record<string, unknown>} metadata - 追加するメタデータ。
   * @returns {this} メソッドチェーン用に自身のインスタンスを返します。
   * @example
   * \`\`\`typescript
   * throw new AppError(ErrorCode.ValidationError, 'Invalid input')
   *   .withMetadata({ field: 'email', value: input.email });
   * \`\`\`
   */
  public withMetadata(metadata: Record<string, unknown>): this {
    // readonly プロパティに直接代入できないため、Object.defineProperty を使用
    Object.defineProperty(this, 'metadata', {
      value: {
        ...this.metadata,
        ...metadata,
      },
      writable: false,
      configurable: true,
    });

    return this;
  }

  /**
   * 特定のキーのメタデータを取得します。
   * @param {string} key - 取得するメタデータのキー。
   * @returns {unknown | undefined} メタデータの値、または未定義の場合はundefined。
   */
  public getMetadata(key: string): unknown | undefined {
    return this.metadata?.[key];
  }

  /**
   * 特定の操作やエンティティに関連するエラーであることを示すメタデータを追加します。
   * @param {string} entityName - エンティティ名（例: 'user', 'order'）。
   * @param {string} entityId - エンティティID。
   * @param {string} operation - 実行された操作（例: 'create', 'update', 'delete'）。
   * @returns {this} メソッドチェーン用に自身のインスタンスを返します。
   * @example
   * \`\`\`typescript
   * throw new AppError(ErrorCode.NotFound, 'User not found')
   *   .withEntityContext('user', userId, 'find');
   * \`\`\`
   */
  public withEntityContext(entityName: string, entityId: string, operation: string): this {
    return this.withMetadata({
      entityName,
      entityId,
      operation,
    });
  }

  // toJSON メソッドは BaseError から継承されるため、再定義の必要はない
  // 必要であれば AppError 固有の情報を含めるようにオーバーライド可能
}
