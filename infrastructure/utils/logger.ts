/**
 * @deprecated このロガーユーティリティは非推奨です。
 * 代わりに @/shared/logger/logger.interface から LoggerInterface を import し、
 * DIコンテナから注入されたロガーを使用してください。
 *
 * ```typescript
 * // 非推奨:
 * import logger from '@/infrastructure/utils/logger';
 * logger.info('メッセージ');
 *
 * // 推奨:
 * import { inject, injectable } from 'tsyringe';
 * import { LoggerInterface, LoggerToken } from '@/shared/logger/logger.interface';
 *
 * @injectable()
 * export class SomeService {
 *   constructor(@inject(LoggerToken) private readonly logger: LoggerInterface) {}
 *
 *   someMethod() {
 *     this.logger.info('メッセージ');
 *     // または構造化ログとして
 *     this.logger.info({ message: 'メッセージ', additionalData: 'データ' });
 *   }
 * }
 * ```
 *
 * このファイルは後方互換性のためにしばらく維持されますが、将来のリリースで削除される予定です。
 */

/**
 * ロギングユーティリティ
 *
 * 環境に応じたログ出力を提供し、console直接使用の警告を回避します
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * ログメッセージの出力
 * 環境に応じた適切な出力制御を行います
 *
 * @param level ログレベル
 * @param message ログメッセージ
 * @param data 追加データ（オブジェクトや配列）
 */
function log(level: LogLevel, message: string, data?: unknown): void {
  // 開発環境のみデバッグログを出力
  if (level === 'debug' && process.env.NODE_ENV === 'production') {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'debug':
    case 'info':
      if (process.env.NODE_ENV !== 'production') {
        // 開発環境ではコンソールに出力
        if (data) {
          // eslint-disable-next-line no-console
          console.log(`${prefix} ${message}`, data);
        } else {
          // eslint-disable-next-line no-console
          console.log(`${prefix} ${message}`);
        }
      }
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(`${prefix} ${message}`, data ? data : '');
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(`${prefix} ${message}`, data ? data : '');
      break;
    default:
      break;
  }

  // プロダクション環境では適切なロギングサービスなどに送信する実装を追加できます
}

/**
 * デバッグログ（開発環境のみ）
 */
export function debug(message: string, data?: unknown): void {
  log('debug', message, data);
}

/**
 * 情報ログ
 */
export function info(message: string, data?: unknown): void {
  log('info', message, data);
}

/**
 * 警告ログ
 */
export function warn(message: string, data?: unknown): void {
  log('warn', message, data);
}

/**
 * エラーログ
 */
export function error(message: string, data?: unknown): void {
  log('error', message, data);
}

// ロガーオブジェクト
// eslint-disable-next-line @typescript-eslint/naming-convention
const logger = {
  debug,
  info,
  warn,
  error,
};

// デフォルトエクスポート
export default logger;
