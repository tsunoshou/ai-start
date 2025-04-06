/**
 * @file 識別子 (Identifier) に関連する共通ユーティリティ関数
 * @description UUID v4 の生成と検証を提供します。
 * 詳細は docs/06_utility_functions.md を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

// import { Brand } from '@/shared/types/utility.types'; // Remove unused import
import { Identifier } from '@/shared/types/common.types';

/**
 * 新しい一意な識別子 (UUID v4) を生成します。
 *
 * @template T - ブランド型 (例: UserId, ProgramId)
 * @returns {T} 指定されたブランド型の新しい識別子。
 * @example
 * const newUserId = generateIdentifier<UserId>();
 */
export function generateIdentifier<T extends Identifier>(): T {
  // Cast through unknown to bypass the strict type check
  // TODO: Consider refactoring to return string and use factory at call site
  // or pass a factory function as an argument for type safety.
  return uuidv4() as unknown as T;
}

/**
 * 与えられた文字列が有効な UUID v4 形式であるかを検証し、
 * 有効であれば指定されたブランド型の識別子として返します。
 *
 * @template T - ブランド型 (例: UserId, ProgramId)
 * @param {string} id - 検証する識別子文字列。
 * @returns {T} 検証済みの識別子。
 * @throws {Error} 文字列が有効な UUID v4 形式でない場合にエラーをスローします。
 * @example
 * const userId = createIdentifier<UserId>('123e4567-e89b-12d3-a456-426614174000');
 * // createIdentifier<UserId>('invalid-uuid'); // -> throws Error
 */
export function createIdentifier<T extends Identifier>(id: string): T {
  if (!uuidValidate(id)) {
    // Consider using AppError for consistency
    // import { AppError, ErrorCode } from '@/shared/errors/app.error';
    // throw new AppError(ErrorCode.InvalidIdentifierFormat, `Invalid Identifier format. Expected UUID v4, received: ${id}`);
    throw new Error(`Invalid Identifier format. Expected UUID v4, received: ${id}`);
  }
  // Cast through unknown to bypass the strict type check
  // TODO: Consider refactoring to return string and use factory at call site
  // or pass a factory function as an argument for type safety.
  return id as unknown as T;
}
