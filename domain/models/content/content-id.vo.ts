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

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';
import { createIdentifier, generateIdentifier } from '@/shared/utils/identifier.utils';

/**
 * 学習コンテンツ（ビデオなど）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * // 新しい ContentId を生成
 * const newId: ContentId = generateContentId();
 *
 * // 既存のUUID文字列から ContentId を作成
 * const existingId: ContentId = createContentId('pqr67890-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createContentId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 */
export type ContentId = Brand<Identifier, 'ContentId'>;

/**
 * 新しい ContentId を生成します。
 * @returns {ContentId} 新しく生成されたコンテンツID。
 */
export const generateContentId = (): ContentId => generateIdentifier<ContentId>();

/**
 * 既存の識別子文字列から ContentId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - コンテンツIDとして使用するUUID文字列。
 * @returns {ContentId} 作成されたコンテンツID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createContentId = (id: string): ContentId => createIdentifier<ContentId>(id);
