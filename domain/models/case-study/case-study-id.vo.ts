/**
 * @file ケーススタディIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として CaseStudyId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * 歴史的なビジネス事例（ケーススタディ）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `case_studies` テーブルなどの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'CaseStudyId'>} CaseStudyId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { CaseStudyId } from '@/domain/models/case-study/case-study-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateCaseStudyId(): CaseStudyId;
 * declare function createCaseStudyId(id: string): CaseStudyId; // バリデーション含む想定
 *
 * const caseStudyId1: CaseStudyId = generateCaseStudyId();
 * const caseStudyId2: CaseStudyId = createCaseStudyId('stu90123-e89b-12d3-a456-426614174000');
 *
 * function getCaseStudy(id: CaseStudyId) {
 *   // ... CaseStudyId を使ってケーススタディを取得する処理 ...
 *   console.log('Fetching case study with ID:', id);
 * }
 *
 * getCaseStudy(caseStudyId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { ProjectId } from '@/domain/models/project/project-id.vo';
 * declare const projectId: ProjectId;
 * // getCaseStudy(projectId); // -> Compile Error!
 * ```
 */
export type CaseStudyId = Brand<Identifier, 'CaseStudyId'>;
