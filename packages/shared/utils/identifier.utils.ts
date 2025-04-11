/**
 * @file 識別子 (Identifier) に関連する共通ユーティリティ関数
 * @description UUID v4 の生成と検証を提供します。
 * 詳細は docs/06_utility_functions.md を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

import { BaseError } from '@core/shared/errors/base.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';

/**
 * 新しい一意な UUID v4 文字列を生成します。
 * Identifier インスタンスの生成は呼び出し元で行ってください。
 *
 * @returns {string} 新しい UUID v4 文字列。
 * @example
 * const newUuid = generateUuidV4String();
 * const userIdResult = UserId.create(newUuid); // Generate UserId at call site
 */
export function generateUuidV4String(): string {
  return uuidv4();
}

/**
 * 与えられた文字列が有効な UUID v4 形式であるかを検証します。
 * Identifier インスタンスの生成は、この関数で成功した文字列を使用して呼び出し元で行ってください。
 *
 * @param {string} id - 検証する識別子文字列。
 * @returns {Result<string, BaseError>} 検証成功時は Ok(id)、失敗時は Err(BaseError)。
 * @example
 * const result = validateUuidV4String('123e4567-e89b-12d3-a456-426614174000');
 * if (result.isOk()) {
 *   const userIdResult = UserId.create(result.value); // Create UserId with validated string
 * } else {
 *   console.error(result.error.message); // "Invalid Identifier format..."
 * }
 *
 * const invalidResult = validateUuidV4String('invalid-uuid');
 * if (invalidResult.isErr()) {
 *   console.error(invalidResult.error.message); // "Invalid Identifier format..."
 * }
 */
export function validateUuidV4String(id: string): Result<string, BaseError> {
  if (!uuidValidate(id)) {
    // Use BaseError with appropriate ErrorCode as defined in docs/05_type_definitions.md
    return err(
      new BaseError(
        ErrorCode.InvalidIdentifierFormat,
        `Invalid Identifier format. Expected UUID v4, received: ${id}`
      )
    );
  }
  return ok(id);
}
