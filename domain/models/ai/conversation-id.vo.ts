/**
 * @file AI会話IDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ConversationId を定義します。
 * AI会話セッションエンティティを一意に識別するための UUID 形式のIDです。
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
 * AIとの会話セッションの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * // 新しい ConversationId を生成
 * const newId: ConversationId = generateConversationId();
 *
 * // 既存のUUID文字列から ConversationId を作成
 * const existingId: ConversationId = createConversationId('mno34567-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createConversationId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 */
export type ConversationId = Brand<Identifier, 'ConversationId'>;

/**
 * 新しい ConversationId を生成します。
 * @returns {ConversationId} 新しく生成されたAI会話ID。
 */
export const generateConversationId = (): ConversationId => generateIdentifier<ConversationId>();

/**
 * 既存の識別子文字列から ConversationId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - AI会話IDとして使用するUUID文字列。
 * @returns {ConversationId} 作成されたAI会話ID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createConversationId = (id: string): ConversationId =>
  createIdentifier<ConversationId>(id);
