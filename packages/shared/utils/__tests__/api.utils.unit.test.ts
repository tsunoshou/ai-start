import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';

import { AppError } from '@core/shared/errors/app.error.ts';
import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import { apiSuccess, apiError, handleApiError, processApiRequest } from '@core/shared/utils/api.utils.ts';

// モックロガーを直接定義
const MOCK_LOGGER = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// コンテナコンフィグのモック
vi.mock('@/config/container.config', () => {
  return {
    default: {
      resolve: vi.fn(() => MOCK_LOGGER),
    },
  };
});

describe('API Utils', () => {
  // コンソールのスパイをセットアップ
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // ログ出力のスパイをセットアップ
    consoleErrorSpy = vi.spyOn(console, 'error');
    consoleWarnSpy = vi.spyOn(console, 'warn');

    // スパイをクリア
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();

    // mockをリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('apiSuccess', () => {
    it('should create a standard success response', async () => {
      const data = { message: 'Success' };
      const response = apiSuccess(200, data);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: true,
        data,
      });
    });

    it('should handle different status codes', () => {
      const data = { id: '123' };
      const response = apiSuccess(201, data);

      expect(response.status).toBe(201);
    });
  });

  describe('apiError', () => {
    it('should create a standard error response', async () => {
      const response = apiError(400, ErrorCode.ValidationError, 'Invalid input');

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: 'Invalid input',
        },
      });
    });

    it('should include details when provided', async () => {
      const details = { fields: ['name'] };
      const response = apiError(400, ErrorCode.ValidationError, 'Invalid input', details);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: 'Invalid input',
          details,
        },
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle AppError and map ErrorCode to status', async () => {
      // AppError を作成
      const mockError = new AppError(ErrorCode.NotFound, 'Resource not found', {
        metadata: { detail: 'some detail' },
      });

      // 関数を呼び出す
      const response = handleApiError(mockError);

      // 期待される応答を検証
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: 'Resource not found',
          details: { detail: 'some detail' },
        },
      });

      // モックロガーのwarnメソッドが呼ばれたことを確認
      expect(MOCK_LOGGER.warn).toHaveBeenCalled();
    });

    it('should handle ZodError and return 400 with details', async () => {
      // ZodError を作成
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);

      // 関数を呼び出す
      const response = handleApiError(zodError);

      // 期待される応答を検証
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: 'Input validation failed',
          details: zodError.errors,
        },
      });

      // モックロガーのwarnメソッドが呼ばれたことを確認
      expect(MOCK_LOGGER.warn).toHaveBeenCalled();
    });

    it('should handle generic Error and return 500', async () => {
      // 一般的な Error を作成
      const genericError = new Error('Something unexpected happened');

      // 関数を呼び出す
      const response = handleApiError(genericError);

      // 期待される応答を検証
      expect(response.status).toBe(500);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.InternalServerError,
          message: 'An unexpected server error occurred.',
        },
      });

      // モックロガーのerrorメソッドが呼ばれたことを確認
      expect(MOCK_LOGGER.error).toHaveBeenCalled();
    });

    it('should handle non-Error thrown values and return 500 UnknownError', async () => {
      // Error オブジェクトではないものをスローする
      const nonError = { message: 'This is not an Error object' };

      // 関数を呼び出す
      const response = handleApiError(nonError);

      // 期待される応答を検証
      expect(response.status).toBe(500);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.UnknownError,
          message: 'An unknown error occurred.',
        },
      });

      // モックロガーのerrorメソッドが呼ばれたことを確認
      expect(MOCK_LOGGER.error).toHaveBeenCalled();
    });

    it('should correctly map various ErrorCodes to status codes', () => {
      // ErrorCode と期待されるステータスコードのマッピングをテスト
      const testCases = [
        { code: ErrorCode.ValidationError, expectedStatus: 400 },
        { code: ErrorCode.InvalidIdentifierFormat, expectedStatus: 400 },
        { code: ErrorCode.UserEmailAlreadyExists, expectedStatus: 400 },
        { code: ErrorCode.DomainRuleViolation, expectedStatus: 400 },
        { code: ErrorCode.Unauthorized, expectedStatus: 401 },
        { code: ErrorCode.Forbidden, expectedStatus: 403 },
        { code: ErrorCode.NotFound, expectedStatus: 404 },
        { code: ErrorCode.ProjectNotFound, expectedStatus: 404 },
        { code: ErrorCode.DbUniqueConstraintViolation, expectedStatus: 409 },
        { code: ErrorCode.ConflictError, expectedStatus: 409 },
        { code: ErrorCode.DatabaseError, expectedStatus: 500 },
        { code: ErrorCode.NetworkError, expectedStatus: 500 },
        { code: ErrorCode.InternalServerError, expectedStatus: 500 },
        { code: ErrorCode.UnknownError, expectedStatus: 500 },
      ];

      // テスト前にモックをクリア
      MOCK_LOGGER.warn.mockClear();
      MOCK_LOGGER.error.mockClear();

      for (const { code, expectedStatus } of testCases) {
        // AppError を作成してハンドル
        const appError = new AppError(code, `Test error for ${code}`);
        const response = handleApiError(appError);

        // 期待されるステータスコードを検証
        expect(response.status).toBe(expectedStatus);
      }

      // ロガーが各テストケースで呼ばれたことを確認
      // 400番台はwarn、500番台はerrorが呼ばれる
      expect(MOCK_LOGGER.warn).toHaveBeenCalled();
      expect(MOCK_LOGGER.error).toHaveBeenCalled();
    });
  });

  describe('processApiRequest', () => {
    it('should process a valid JSON body request', async () => {
      // Zodスキーマの作成
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // 仮のNextRequestを作成
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ name: 'Alice', age: 30 }),
      } as unknown as NextRequest;

      // ハンドラー関数
      const handler = vi.fn().mockResolvedValue({ id: '123', name: 'Alice', age: 30 });

      // 関数を呼び出す
      const response = await processApiRequest(mockRequest, {
        bodySchema: schema,
        handler,
      });

      // ハンドラーが正しい引数で呼ばれたか検証
      expect(handler).toHaveBeenCalledWith({ name: 'Alice', age: 30 });

      // 応答の検証
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: true,
        data: { id: '123', name: 'Alice', age: 30 },
      });
    });

    it('should handle query parameters', async () => {
      // Zodスキーマの作成
      const schema = z.object({
        search: z.string(),
        page: z.coerce.number(),
      });

      // searchParamsを持つURLオブジェクトをモック
      const searchParams = new URLSearchParams();
      searchParams.append('search', 'test');
      searchParams.append('page', '2');

      // 仮のNextRequestを作成
      const mockRequest = {
        nextUrl: {
          searchParams,
          entries: () => searchParams.entries(),
        },
      } as unknown as NextRequest;

      // ハンドラー関数
      const handler = vi.fn().mockResolvedValue({ results: ['test result'], page: 2 });

      // 関数を呼び出す
      const response = await processApiRequest(mockRequest, {
        querySchema: schema,
        handler,
      });

      // ハンドラーが正しい引数で呼ばれたか検証
      expect(handler).toHaveBeenCalledWith({ search: 'test', page: 2 });

      // 応答の検証
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: true,
        data: { results: ['test result'], page: 2 },
      });
    });

    it('should handle URL path parameters', async () => {
      // Zodスキーマの作成
      const schema = z.object({
        id: z.string().uuid(),
      });

      // 仮のNextRequestを作成
      const mockRequest = {} as NextRequest;

      // パラメータを定義
      const params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      // ハンドラー関数
      const handler = vi.fn().mockResolvedValue({
        id: params.id,
        name: 'Test Item',
      });

      // 関数を呼び出す
      const response = await processApiRequest(mockRequest, {
        paramsSchema: schema,
        params,
        handler,
      });

      // ハンドラーが正しい引数で呼ばれたか検証
      expect(handler).toHaveBeenCalledWith({ id: params.id });

      // 応答の検証
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        success: true,
        data: { id: params.id, name: 'Test Item' },
      });
    });

    it('should handle validation errors', async () => {
      // Zodスキーマの作成
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
      });

      // 不正なデータを持つリクエストをモック
      const mockRequest = {
        json: vi.fn().mockResolvedValue({ name: 'Alice', age: -5 }),
      } as unknown as NextRequest;

      // ハンドラー関数（これは呼ばれないはず）
      const handler = vi.fn();

      // 関数を呼び出す
      const response = await processApiRequest(mockRequest, {
        bodySchema: schema,
        handler,
      });

      // ハンドラーが呼ばれていないことを検証
      expect(handler).not.toHaveBeenCalled();

      // エラーレスポンスの検証
      expect(response.status).toBe(400);
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('success', false);
      expect(responseBody).toHaveProperty('error.code', ErrorCode.ValidationError);
    });
  });
});
