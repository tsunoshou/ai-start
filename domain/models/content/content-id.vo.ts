/**
 * @file コンテンツIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ContentId を定義します。
 * 学習コンテンツエンティティを一意に識別するための UUID 形式のIDです。
 * 詳細は docs/05_type_definitions.md を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { Result, ok, err } from 'neverthrow';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { generateUuidV4String, validateUuidV4String } from '@/shared/utils/identifier.utils';
import { BaseId } from '@/shared/value-objects/base-id.vo';
// Import the new utility functions

/**
 * @class ContentId
 * @extends BaseId<string>
 * @description Represents the unique identifier for a Content entity (e.g., video, article).
 */
export class ContentId extends BaseId<string> {
  /**
   * Private constructor to enforce creation via static factory methods.
   * @param {string} value - The UUID string value.
   * @private
   */
  private constructor(value: string) {
    super(value);
  }

  /**
   * Creates a ContentId instance from a string.
   * Validates that the string is a valid UUID v4 using the utility function.
   * @param {string} id - The UUID string.
   * @returns {Result<ContentId, BaseError>} Ok with ContentId instance or Err with BaseError.
   */
  public static create(id: string): Result<ContentId, BaseError> {
    // 1. Validate the input string using the utility
    const validationResult = validateUuidV4String(id);
    if (validationResult.isErr()) {
      return err(validationResult.error); // Propagate the error
    }
    // 2. If valid, create the instance
    return ok(new ContentId(validationResult.value));
  }

  /**
   * Generates a new ContentId with a v4 UUID.
   * @returns {Result<ContentId, BaseError>} Ok with the new ContentId instance, or Err if UUID generation fails.
   */
  public static generate(): Result<ContentId, BaseError> {
    try {
      // 1. Generate a new UUID string using the utility
      const newUuid = generateUuidV4String();
      // 2. Create the instance
      return ok(new ContentId(newUuid));
    } catch (error) {
      return err(
        new BaseError(ErrorCode.InternalServerError, 'Failed to generate new ContentId', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }
}
