import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZodError } from 'zod';

import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

import { apiSuccess, apiError, handleApiError } from '../api.utils';

// Use 'any' as a temporary workaround for the spy type issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConsoleSpy = any;

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiSuccess', () => {
    it('should create a standard success response', async () => {
      const data = { message: 'Success' };
      const response = apiSuccess(200, data);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, data });
    });

    it('should handle different status codes', async () => {
      const data = { id: 123 };
      const response = apiSuccess(201, data);
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ success: true, data });
    });
  });

  describe('apiError', () => {
    it('should create a standard error response', async () => {
      const response = apiError(400, ErrorCode.ValidationError, 'Invalid input');
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: 'Invalid input',
          details: undefined,
        },
      });
    });

    it('should include details when provided', async () => {
      const details = { field: 'email', issue: 'format' };
      const response = apiError(404, ErrorCode.NotFound, 'User not found', details);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: 'User not found',
          details,
        },
      });
    });
  });

  describe('handleApiError', () => {
    // Ensure the disable comment is present for the spy variable
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let consoleErrorSpy: ConsoleSpy;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle AppError and map ErrorCode to status', async () => {
      const mockMetadata = { detail: 'some detail' };
      const mockError = new AppError(ErrorCode.NotFound, 'Resource not found', {
        metadata: mockMetadata,
      });

      const response = handleApiError(mockError);
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody).toHaveProperty('error');
      expect(responseBody.error).toHaveProperty('code', ErrorCode.NotFound);
      expect(responseBody.error).toHaveProperty('message', 'Resource not found');
      expect(responseBody.error).toHaveProperty('details');
      expect(responseBody.error.details).toEqual(mockMetadata);
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.NotFound,
          message: 'Resource not found',
          details: mockMetadata,
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API Error Handler]:', mockError);
    });

    it('should handle ZodError and return 400 with details', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number',
        },
      ]);

      const response = handleApiError(zodError);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.ValidationError,
          message: 'Input validation failed',
          details: zodError.errors,
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API Error Handler]:', zodError);
    });

    it('should handle generic Error and return 500', async () => {
      const genericError = new Error('Something unexpected happened');

      const response = handleApiError(genericError);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.InternalServerError,
          message: 'An unexpected server error occurred.',
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API Error Handler]:', genericError);
    });

    it('should handle non-Error thrown values and return 500 UnknownError', async () => {
      const nonError = { message: 'This is not an Error object' };

      const response = handleApiError(nonError);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody).toEqual({
        success: false,
        error: {
          code: ErrorCode.UnknownError,
          message: 'An unknown error occurred.',
        },
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[API Error Handler]:', nonError);
    });

    it('should correctly map various ErrorCodes to status codes', async () => {
      const testCases: { code: ErrorCode; expectedStatus: number }[] = [
        { code: ErrorCode.ValidationError, expectedStatus: 400 },
        { code: ErrorCode.InvalidIdentifierFormat, expectedStatus: 400 },
        { code: ErrorCode.UserEmailAlreadyExists, expectedStatus: 400 },
        { code: ErrorCode.DomainRuleViolation, expectedStatus: 400 },
        { code: ErrorCode.Unauthorized, expectedStatus: 401 },
        { code: ErrorCode.Forbidden, expectedStatus: 403 },
        { code: ErrorCode.NotFound, expectedStatus: 404 },
        { code: ErrorCode.ProjectNotFound, expectedStatus: 404 },
        { code: ErrorCode.DbUniqueConstraintViolation, expectedStatus: 409 },
        { code: ErrorCode.DatabaseError, expectedStatus: 500 },
        { code: ErrorCode.NetworkError, expectedStatus: 500 },
        { code: ErrorCode.PasswordHashingFailed, expectedStatus: 500 },
        { code: ErrorCode.UnknownError, expectedStatus: 500 },
        { code: ErrorCode.InternalServerError, expectedStatus: 500 },
      ];

      for (const { code, expectedStatus } of testCases) {
        const error = new AppError(code, `Test error for ${code}`);
        const response = handleApiError(error);
        const responseBody = await response.json();

        expect(response.status).toBe(expectedStatus);
        expect(responseBody.error.code).toBe(code);
      }
      expect(consoleErrorSpy).toHaveBeenCalledTimes(testCases.length);
    });
  });
});
