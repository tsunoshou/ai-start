/**
 * @file アプリケーション全体で使用される標準エラーコードを定義します。
 */

/**
 * @enum ErrorCode
 * @description アプリケーション全体で利用される標準的なエラーコード。
 * 各エラーコードは、特定のエラー状況を一意に識別するために使用されます。
 * メンバー名は PascalCase、値は UPPER_SNAKE_CASE で定義されます。
 *
 * @property UnknownError - 未特定または予期しないエラー
 * @property ValidationError - 入力データまたはパラメータの検証失敗
 * @property NotFound - 要求されたリソースが見つからない
 * @property Unauthorized - 認証されていない、または認証情報が無効
 * @property Forbidden - 認証済みだが、リソースへのアクセス権限がない
 * @property InternalServerError - サーバー内部での予期せぬエラー
 * @property DatabaseError - データベース操作中のエラー
 * @property NetworkError - ネットワーク通信中のエラー
 * @property ApiRequestFailed - 外部APIへのリクエスト失敗
 * @property ConfigurationError - 設定の不備または不足
 * @property AiServiceError - AIサービス（OpenAI, Anthropic等）関連のエラー
 * @property AiRateLimitExceeded - AIサービスのレート制限超過
 * @property AiTimeout - AIサービスへのリクエストタイムアウト
 * @property AiInvalidRequest - AIサービスへの無効なリクエスト
 * @property AiProviderUnavailable - AIプロバイダーが利用不可
 * @property AllAiProvidersUnavailable - すべてのAIプロバイダーが利用不可
 * @property UserEmailAlreadyExists - 指定されたメールアドレスは既に使用されている
 * @property ProjectNotFound - 指定されたプロジェクトが見つからない
 * @property DbUniqueConstraintViolation - データベースの一意性制約違反 (より具体的に変換されるべき)
 * @property InvalidIdentifierFormat - 識別子の形式が無効 (UUIDなど)
 * @property PasswordHashingFailed - パスワードハッシュ化に失敗
 * @property DomainRuleViolation - ドメインルール違反
 * @property ConflictError - 既存リソースとの競合が発生
 * @property PasswordVerificationFailed - パスワード検証に失敗
 */
export enum ErrorCode {
  UnknownError = 'UNKNOWN_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  NotFound = 'NOT_FOUND',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  DatabaseError = 'DATABASE_ERROR',
  NetworkError = 'NETWORK_ERROR',
  ApiRequestFailed = 'API_REQUEST_FAILED',
  ConfigurationError = 'CONFIGURATION_ERROR',
  AiServiceError = 'AI_SERVICE_ERROR',
  AiRateLimitExceeded = 'AI_RATE_LIMIT_EXCEEDED',
  AiTimeout = 'AI_TIMEOUT',
  AiInvalidRequest = 'AI_INVALID_REQUEST',
  AiProviderUnavailable = 'AI_PROVIDER_UNAVAILABLE',
  AllAiProvidersUnavailable = 'ALL_AI_PROVIDERS_UNAVAILABLE',
  UserEmailAlreadyExists = 'USER_EMAIL_ALREADY_EXISTS',
  ProjectNotFound = 'PROJECT_NOT_FOUND',
  DbUniqueConstraintViolation = 'DB_UNIQUE_CONSTRAINT_VIOLATION',
  InvalidIdentifierFormat = 'INVALID_IDENTIFIER_FORMAT',
  PasswordHashingFailed = 'PASSWORD_HASHING_FAILED',
  DomainRuleViolation = 'DOMAIN_RULE_VIOLATION',
  ConflictError = 'CONFLICT_ERROR',
  PasswordVerificationFailed = 'PASSWORD_VERIFICATION_FAILED',
}
