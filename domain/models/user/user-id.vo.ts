/**
 * @file ユーザーIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として UserId を定義します。
 * ユーザーエンティティを一意に識別するための UUID 形式のIDです。
 * 詳細は docs/05_type_definitions.md を参照。
 *
 * @author tsunoshou
 * @date 2025-04-05
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';
import { createIdentifier, generateIdentifier } from '@/shared/utils/identifier.utils';

/**
 * ユーザーの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * // 新しい UserId を生成
 * const newId: UserId = generateUserId();
 *
 * // 既存のUUID文字列から UserId を作成
 * const existingId: UserId = createUserId('123e4567-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createUserId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 */
export type UserId = Brand<Identifier, 'UserId'>;

/**
 * 新しい UserId を生成します。
 * @returns {UserId} 新しく生成されたユーザーID。
 */
export const generateUserId = (): UserId => generateIdentifier<UserId>();

/**
 * 既存の識別子文字列から UserId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - ユーザーIDとして使用するUUID文字列。
 * @returns {UserId} 作成されたユーザーID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createUserId = (id: string): UserId => createIdentifier<UserId>(id);
