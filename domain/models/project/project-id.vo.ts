/**
 * @file プロジェクトIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ProjectId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * プロジェクトの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `projects` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'ProjectId'>} ProjectId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { ProjectId } from '@/domain/models/project/project-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateProjectId(): ProjectId;
 * declare function createProjectId(id: string): ProjectId; // バリデーション含む想定
 *
 * const projectId1: ProjectId = generateProjectId();
 * const projectId2: ProjectId = createProjectId('abc12345-e89b-12d3-a456-426614174000');
 *
 * function getProject(id: ProjectId) {
 *   // ... ProjectId を使ってプロジェクトを取得する処理 ...
 *   console.log('Fetching project with ID:', id);
 * }
 *
 * getProject(projectId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { UserId } from '@/domain/models/user/user-id.vo';
 * declare const userId: UserId;
 * // getProject(userId); // -> Compile Error!
 * ```
 */
export type ProjectId = Brand<Identifier, 'ProjectId'>;
