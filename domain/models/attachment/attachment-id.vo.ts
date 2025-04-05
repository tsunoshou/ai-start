/**
 * @file 添付ファイルIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として AttachmentId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * プロジェクトやステップに添付されるファイルの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * // 新しい AttachmentId を生成
 * const newId: AttachmentId = generateAttachmentId();
 *
 * // 既存のUUID文字列から AttachmentId を作成
 * const existingId: AttachmentId = createAttachmentId('yz012345-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createAttachmentId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 */
export type AttachmentId = Brand<Identifier, 'AttachmentId'>;
