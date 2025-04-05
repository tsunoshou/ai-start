/**
 * @file AI会話IDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ConversationId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * AIとの会話セッションの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `conversations` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'ConversationId'>} ConversationId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { ConversationId } from '@/domain/models/ai/conversation-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateConversationId(): ConversationId;
 * declare function createConversationId(id: string): ConversationId; // バリデーション含む想定
 *
 * const conversationId1: ConversationId = generateConversationId();
 * const conversationId2: ConversationId = createConversationId('mno34567-e89b-12d3-a456-426614174000');
 *
 * function getConversation(id: ConversationId) {
 *   // ... ConversationId を使って会話履歴を取得する処理 ...
 *   console.log('Fetching conversation with ID:', id);
 * }
 *
 * getConversation(conversationId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { UserId } from '@/domain/models/user/user-id.vo';
 * declare const userId: UserId;
 * // getConversation(userId); // -> Compile Error!
 * ```
 */
export type ConversationId = Brand<Identifier, 'ConversationId'>;
