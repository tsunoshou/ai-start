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
 * データベース上の `attachments` テーブルなどの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'AttachmentId'>} AttachmentId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { AttachmentId } from '@/domain/models/attachment/attachment-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateAttachmentId(): AttachmentId;
 * declare function createAttachmentId(id: string): AttachmentId; // バリデーション含む想定
 *
 * const attachmentId1: AttachmentId = generateAttachmentId();
 * const attachmentId2: AttachmentId = createAttachmentId('yz012345-e89b-12d3-a456-426614174000');
 *
 * function getAttachment(id: AttachmentId) {
 *   // ... AttachmentId を使って添付ファイル情報を取得する処理 ...
 *   console.log('Fetching attachment with ID:', id);
 * }
 *
 * getAttachment(attachmentId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { ProjectId } from '@/domain/models/project/project-id.vo';
 * declare const projectId: ProjectId;
 * // getAttachment(projectId); // -> Compile Error!
 * ```
 */
export type AttachmentId = Brand<Identifier, 'AttachmentId'>;
