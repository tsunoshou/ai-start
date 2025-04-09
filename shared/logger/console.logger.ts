import { injectable } from 'tsyringe';

import { LogData, LoggerInterface } from './logger.interface';

/**
 * コンソールロガー実装
 * シンプルなコンソール出力によるロギング実装です。
 * 開発環境や、より高度なロギングシステムへの移行前の初期実装として機能します。
 */
@injectable()
export class ConsoleLogger implements LoggerInterface {
  /**
   * 内部的なログ出力メソッド
   * 全てのログレベルで共通の処理を行います。
   *
   * @param level ログレベル（'info', 'warn', 'error', 'debug'）
   * @param data ログメッセージまたは構造化ログデータ
   * @param error エラーオブジェクト（オプション）
   */
  private log(level: string, data: LogData | string, error?: unknown): void {
    // 現在の時刻を取得
    const timestamp = new Date().toISOString();

    // 文字列またはオブジェクトを適切に処理
    const logEntry: Record<string, unknown> =
      typeof data === 'string' ? { message: data } : { ...data };

    // エラーオブジェクトがある場合は追加
    if (error !== undefined) {
      if (error instanceof Error) {
        logEntry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logEntry.error = error;
      }
    }

    // ログエントリに時刻を追加
    const formattedEntry = {
      timestamp,
      level: level.toUpperCase(),
      ...logEntry,
    };

    // コンソールに出力（レベルに応じたメソッド使用）
    if (level === 'error') {
      console.error(JSON.stringify(formattedEntry, null, 2));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(formattedEntry, null, 2));
    } else if (level === 'debug') {
      console.debug(JSON.stringify(formattedEntry, null, 2));
    } else {
      console.log(JSON.stringify(formattedEntry, null, 2));
    }
  }

  /**
   * 情報ログを出力します。
   * @param data ログメッセージまたは構造化ログデータ
   */
  info(data: LogData | string): void {
    this.log('info', data);
  }

  /**
   * 警告ログを出力します。
   * @param data ログメッセージまたは構造化ログデータ
   */
  warn(data: LogData | string): void {
    this.log('warn', data);
  }

  /**
   * エラーログを出力します。
   * @param data ログメッセージまたは構造化ログデータ
   * @param error エラーオブジェクト（オプション）
   */
  error(data: LogData | string, error?: unknown): void {
    this.log('error', data, error);
  }

  /**
   * デバッグログを出力します。
   * @param data ログメッセージまたは構造化ログデータ
   */
  debug(data: LogData | string): void {
    this.log('debug', data);
  }
}
