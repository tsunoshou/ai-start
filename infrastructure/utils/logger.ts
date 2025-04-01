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
          console.log(`${prefix} ${message}`, data);
        } else {
          console.log(`${prefix} ${message}`);
        }
      }
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`, data ? data : '');
      break;
    case 'error':
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

// デフォルトエクスポート
export default {
  debug,
  info,
  warn,
  error,
};
