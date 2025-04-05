/**
 * @file コンテンツIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ContentId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * 学習コンテンツ（ビデオなど）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `contents` テーブルなどの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'ContentId'>} ContentId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { ContentId } from '@/domain/models/content/content-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateContentId(): ContentId;
 * declare function createContentId(id: string): ContentId; // バリデーション含む想定
 *
 * const contentId1: ContentId = generateContentId();
 * const contentId2: ContentId = createContentId('pqr67890-e89b-12d3-a456-426614174000');
 *
 * function getContent(id: ContentId) {
 *   // ... ContentId を使ってコンテンツを取得する処理 ...
 *   console.log('Fetching content with ID:', id);
 * }
 *
 * getContent(contentId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { StepId } from '@/domain/models/step/step-id.vo';
 * declare const stepId: StepId;
 * // getContent(stepId); // -> Compile Error!
 * ```
 */
export type ContentId = Brand<Identifier, 'ContentId'>;
