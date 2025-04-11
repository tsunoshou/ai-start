import bcrypt from 'bcrypt';
import { Result, ok, err } from 'neverthrow';

import { AppError } from '@core/shared/errors/app.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { LoggerInterface } from '@core/shared/logger/logger.interface';

// ソルトラウンド数（推奨値は10-12程度、CPU負荷とのトレードオフ）
const SALT_ROUNDS = 10;

/**
 * @function hashPassword
 * @description Hashes a plain text password using bcrypt.
 * @param {string} plainTextPassword The plain text password to hash.
 * @param {LoggerInterface} [logger] Optional logger for error logging.
 * @returns {Promise<Result<string, AppError>>} A Result containing the hashed password or an AppError.
 */
export async function hashPassword(
  plainTextPassword: string,
  logger?: LoggerInterface
): Promise<Result<string, AppError>> {
  try {
    if (!plainTextPassword) {
      return err(new AppError(ErrorCode.ValidationError, 'Password cannot be empty'));
    }
    const hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
    return ok(hashedPassword);
  } catch (error) {
    if (logger) {
      logger.error(
        {
          message: 'パスワードハッシュ化中にエラーが発生しました',
          operation: 'hashPassword',
        },
        error
      );
    } else {
      console.error('[PasswordUtils] Error hashing password:', error);
    }
    return err(
      new AppError(ErrorCode.PasswordHashingFailed, 'Error during password hashing', {
        cause: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }
}

/**
 * @function verifyPassword
 * @description Verifies a plain text password against a stored hash.
 * @param {string} plainTextPassword The plain text password to verify.
 * @param {string} storedHash The stored password hash.
 * @param {LoggerInterface} [logger] Optional logger for error logging.
 * @returns {Promise<Result<boolean, AppError>>} A Result containing true if the password matches, false otherwise, or an AppError.
 */
export async function verifyPassword(
  plainTextPassword: string,
  storedHash: string,
  logger?: LoggerInterface
): Promise<Result<boolean, AppError>> {
  try {
    if (!plainTextPassword || !storedHash) {
      // Avoid comparing empty strings which might lead to unexpected results with some libraries
      return ok(false);
    }
    const match = await bcrypt.compare(plainTextPassword, storedHash);
    return ok(match);
  } catch (error) {
    if (logger) {
      logger.error(
        {
          message: 'パスワード検証中にエラーが発生しました',
          operation: 'verifyPassword',
        },
        error
      );
    } else {
      console.error('[PasswordUtils] Error verifying password:', error);
    }
    // bcrypt.compare can throw errors for malformed hashes etc.
    return err(
      new AppError(ErrorCode.PasswordVerificationFailed, 'Error during password verification', {
        cause: error instanceof Error ? error : new Error(String(error)),
      })
    );
  }
}
