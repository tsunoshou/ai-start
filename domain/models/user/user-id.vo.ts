/**
 * @file ユーザーIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として UserId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * ユーザーの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `users` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'UserId'>} UserId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { UserId } from '@/domain/models/user/user-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateUserId(): UserId;
 * declare function createUserId(id: string): UserId; // バリデーション含む想定
 *
 * const userId1: UserId = generateUserId();
 * const userId2: UserId = createUserId('123e4567-e89b-12d3-a456-426614174000');
 *
 * function getUser(id: UserId) {
 *   // ... UserId を使ってユーザーを取得する処理 ...
 *   console.log('Fetching user with ID:', id);
 * }
 *
 * getUser(userId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * type ProductId = Brand<Identifier, 'ProductId'>;
 * declare const productId: ProductId;
 * // getUser(productId); // -> Compile Error!
 * ```
 */
export type UserId = Brand<Identifier, 'UserId'>;
