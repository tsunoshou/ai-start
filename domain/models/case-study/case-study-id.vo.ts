/**
 * @file ケーススタディIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として CaseStudyId を定義します。
 * ケーススタディエンティティを一意に識別するための UUID 形式のIDです。
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
 * 歴史的なビジネス事例（ケーススタディ）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * // 新しい CaseStudyId を生成
 * const newId: CaseStudyId = generateCaseStudyId();
 *
 * // 既存のUUID文字列から CaseStudyId を作成
 * const existingId: CaseStudyId = createCaseStudyId('stu90123-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createCaseStudyId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 */
export type CaseStudyId = Brand<Identifier, 'CaseStudyId'>;

/**
 * 新しい CaseStudyId を生成します。
 * @returns {CaseStudyId} 新しく生成されたケーススタディID。
 */
export const generateCaseStudyId = (): CaseStudyId => generateIdentifier<CaseStudyId>();

/**
 * 既存の識別子文字列から CaseStudyId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - ケーススタディIDとして使用するUUID文字列。
 * @returns {CaseStudyId} 作成されたケーススタディID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createCaseStudyId = (id: string): CaseStudyId => createIdentifier<CaseStudyId>(id);
