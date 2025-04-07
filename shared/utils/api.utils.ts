import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import container from '@/config/container.config';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.interface';

/**
 * @interface ApiErrorResponse
 * @description Standard error response format for API endpoints.
 */
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown; // For validation errors or other details
  };
}

/**
 * @interface ApiSuccessResponse<T>
 * @description Standard success response format for API endpoints.
 */
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Creates a standard success JSON response.
 * @param status HTTP status code.
 * @param data The data payload.
 * @returns A NextResponse object.
 */
export function apiSuccess<T>(status: number, data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Creates a standard error JSON response.
 * @param status HTTP status code.
 * @param code The application-specific error code.
 * @param message The error message.
 * @param details Optional additional error details.
 * @returns A NextResponse object.
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

/**
 * Maps ErrorCode enum members to HTTP status codes.
 * @param code The ErrorCode.
 * @returns The corresponding HTTP status code.
 */
function mapErrorCodeToStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.ValidationError:
    case ErrorCode.InvalidIdentifierFormat:
    case ErrorCode.UserEmailAlreadyExists: // Considered a client error (conflict)
    case ErrorCode.DomainRuleViolation:
      return 400; // Bad Request
    case ErrorCode.Unauthorized:
      return 401; // Unauthorized
    case ErrorCode.Forbidden:
      return 403; // Forbidden
    case ErrorCode.NotFound:
    case ErrorCode.ProjectNotFound: // Example of specific NotFound
      return 404; // Not Found
    case ErrorCode.DbUniqueConstraintViolation: // Could also be 400 depending on context
    case ErrorCode.ConflictError:
      return 409; // Conflict
    case ErrorCode.DatabaseError:
    case ErrorCode.NetworkError:
    case ErrorCode.ApiRequestFailed:
    case ErrorCode.ConfigurationError:
    case ErrorCode.AiServiceError:
    case ErrorCode.AiRateLimitExceeded:
    case ErrorCode.AiTimeout:
    case ErrorCode.AiInvalidRequest:
    case ErrorCode.AiProviderUnavailable:
    case ErrorCode.AllAiProvidersUnavailable:
    case ErrorCode.PasswordHashingFailed:
    case ErrorCode.UnknownError:
    case ErrorCode.InternalServerError:
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Handles errors caught in API Route Handlers and returns an appropriate error response.
 * Differentiates between AppError, ZodError (for request validation), and other Errors.
 * @param error The error object caught.
 * @returns A NextResponse object representing the error.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // ロガーを取得
  const logger = container.resolve<LoggerInterface>(LoggerToken);

  if (error instanceof AppError) {
    const status = mapErrorCodeToStatus(error.code);

    // クライアントエラー (4xx) と サーバーエラー (5xx) を異なるレベルでログに記録
    if (status >= 500) {
      logger.error(
        {
          message: `API Error: ${error.message}`,
          code: error.code,
          status,
          metadata: error.metadata,
        },
        error.cause
      );
    } else {
      logger.warn({
        message: `API Client Error: ${error.message}`,
        code: error.code,
        status,
        metadata: error.metadata,
      });
    }

    return apiError(status, error.code, error.message, error.metadata);
  }

  if (error instanceof z.ZodError) {
    // Zod バリデーションエラーを記録
    logger.warn({
      message: 'API Input Validation Failed',
      code: ErrorCode.ValidationError,
      errors: error.errors,
    });

    // Handle Zod validation errors specifically
    return apiError(
      400,
      ErrorCode.ValidationError, // Use standard validation error code
      'Input validation failed',
      error.errors // Provide Zod error details
    );
  }

  if (error instanceof Error) {
    // 予期せぬエラーを記録
    logger.error(
      {
        message: `Unexpected Server Error: ${error.message}`,
        code: ErrorCode.InternalServerError,
      },
      error
    );

    // Generic unexpected errors
    return apiError(500, ErrorCode.InternalServerError, 'An unexpected server error occurred.');
  }

  // Error オブジェクトではない場合
  logger.error({
    message: 'Unknown Error Type in API',
    code: ErrorCode.UnknownError,
    error,
  });

  // Fallback for non-Error types thrown
  return apiError(500, ErrorCode.UnknownError, 'An unknown error occurred.');
}

/**
 * APIリクエストを処理する共通の関数
 *
 * この関数はAPIハンドラーのロジックを抽象化し、共通のエラーハンドリングとリクエスト処理を提供します。
 * リクエストの解析、バリデーション、ビジネスロジックの実行、レスポンスの生成などを一貫して行います。
 *
 * @template T - 処理後のデータ型（レスポンス型）
 * @template SchemaType - 入力スキーマの型（Zodスキーマによって定義）
 * @param request - NextJSのリクエストオブジェクト
 * @param options - リクエスト処理オプション
 * @returns 標準的なAPIレスポンス
 */
export async function processApiRequest<T, SchemaType = unknown>(
  request: NextRequest,
  options: {
    // 必須オプション
    handler: (data: SchemaType) => Promise<T>;
    successStatus?: number; // 成功時のステータスコード（デフォルト: 200）

    // 入力検証オプション（リクエスト種類に応じて選択）
    // JSONボディ検証
    bodySchema?: z.ZodType<SchemaType>;

    // クエリパラメータ検証
    querySchema?: z.ZodType<SchemaType>;

    // URLパラメータ検証
    paramsSchema?: z.ZodType<SchemaType>;
    params?: Record<string, string>;
  }
): Promise<NextResponse> {
  try {
    let validatedData: SchemaType;

    // 入力データの検証
    if (options.bodySchema) {
      // JSONボディの検証
      const body = await request.json();
      const result = options.bodySchema.safeParse(body);

      if (!result.success) {
        throw result.error;
      }
      validatedData = result.data;
    } else if (options.querySchema) {
      // クエリパラメータの検証
      const { searchParams } = request.nextUrl;
      const queryParams = Object.fromEntries(searchParams.entries());
      const result = options.querySchema.safeParse(queryParams);

      if (!result.success) {
        throw result.error;
      }
      validatedData = result.data;
    } else if (options.paramsSchema && options.params) {
      // URLパラメータの検証
      const result = options.paramsSchema.safeParse(options.params);

      if (!result.success) {
        throw result.error;
      }
      validatedData = result.data;
    } else {
      // スキーマが指定されていない場合は空オブジェクトを使用
      validatedData = {} as SchemaType;
    }

    // ビジネスロジックの実行
    const responseData = await options.handler(validatedData);

    // 成功レスポンスの生成
    return apiSuccess(options.successStatus || 200, responseData);
  } catch (error) {
    // 統一されたエラーハンドリング
    return handleApiError(error);
  }
}
