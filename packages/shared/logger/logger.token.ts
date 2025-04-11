/**
 * ロガーインターフェースのDIトークン
 * 依存性注入コンテナでLoggerInterfaceの実装を登録・解決するために使用します。
 */
export const LoggerToken = Symbol('LoggerInterface');
