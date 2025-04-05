/**
 * @file サブスクリプションIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として SubscriptionId を定義します。
 * サブスクリプションエンティティを一意に識別するための UUID 形式のIDです。
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
 * ユーザーのサブスクリプション契約の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `subscriptions` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'SubscriptionId'>} SubscriptionId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { SubscriptionId, generateSubscriptionId, createSubscriptionId } from '@/domain/models/subscription/subscription-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateSubscriptionId(): SubscriptionId;
 * declare function createSubscriptionId(id: string): SubscriptionId; // バリデーション含む想定
 *
 * const subscriptionId1: SubscriptionId = generateSubscriptionId();
 * const subscriptionId2: SubscriptionId = createSubscriptionId('vwx23456-e89b-12d3-a456-426614174000');
 *
 * function getSubscription(id: SubscriptionId) {
 *   // ... SubscriptionId を使ってサブスクリプション情報を取得する処理 ...
 *   console.log('Fetching subscription with ID:', id);
 * }
 *
 * getSubscription(subscriptionId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { UserId } from '@/domain/models/user/user-id.vo';
 * declare const userId: UserId;
 * // getSubscription(userId); // -> Compile Error!
 * ```
 */
export type SubscriptionId = Brand<Identifier, 'SubscriptionId'>;

/**
 * 新しい SubscriptionId を生成します。
 * @returns {SubscriptionId} 新しく生成されたサブスクリプションID。
 */
export const generateSubscriptionId = (): SubscriptionId => generateIdentifier<SubscriptionId>();

/**
 * 既存の識別子文字列から SubscriptionId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - サブスクリプションIDとして使用するUUID文字列。
 * @returns {SubscriptionId} 作成されたサブスクリプションID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createSubscriptionId = (id: string): SubscriptionId =>
  createIdentifier<SubscriptionId>(id);
