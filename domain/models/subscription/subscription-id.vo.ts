/**
 * @file サブスクリプションIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として SubscriptionId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

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
 * import { SubscriptionId } from '@/domain/models/subscription/subscription-id.vo';
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
