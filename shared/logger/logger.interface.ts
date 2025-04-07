/**
 * ロギングインターフェース
 * アプリケーション全体で一貫したログ出力方法を提供します。
 */

export const LoggerToken = Symbol('LoggerInterface');

/**
 * ログデータの形式を定義します。
 * 構造化ログを推奨し、メッセージと任意のコンテキストデータを含めます。
 */
export interface LogData {
  message: string;
  [key: string]: unknown; // 任意の構造化データ
}

/**
 * ロガーインターフェース
 * 異なるログレベルに対応するメソッドを提供します。
 */
export interface LoggerInterface {
  /**
   * 通常の情報ログを出力します。
   * @param data ログメッセージまたは構造化ログデータ
   */
  info(data: LogData | string): void;

  /**
   * 警告ログを出力します。深刻ではないが注意が必要な状況に使用します。
   * @param data ログメッセージまたは構造化ログデータ
   */
  warn(data: LogData | string): void;

  /**
   * エラーログを出力します。例外や障害が発生した場合に使用します。
   * @param data ログメッセージまたは構造化ログデータ
   * @param error エラーオブジェクト（オプション）
   */
  error(data: LogData | string, error?: unknown): void;

  /**
   * デバッグログを出力します。開発時のデバッグ用で、本番環境では出力しないことも多いです。
   * @param data ログメッセージまたは構造化ログデータ
   */
  debug(data: LogData | string): void;
}
