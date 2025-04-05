/**
 * @file プロジェクトIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ProjectId を定義します。
 * プロジェクトエンティティを一意に識別するための UUID 形式のIDです。
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
 * プロジェクトの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 *
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * const newId: ProjectId = generateProjectId();
 * const existingId: ProjectId = createProjectId('abc12345-e89b-12d3-a456-426614174000');
 * const invalidId = createProjectId('invalid-uuid'); // -> Error
 * console.log(newId);
 * console.log(existingId);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { UserId } from '@/domain/models/user/user-id.vo';
 * declare const userId: UserId;
 * // getProject(userId); // -> Compile Error!
 */
export type ProjectId = Brand<Identifier, 'ProjectId'>;

/**
 * 新しい ProjectId を生成します。
 * @returns {ProjectId} 新しく生成されたプロジェクトID。
 */
export const generateProjectId = (): ProjectId => generateIdentifier<ProjectId>();

/**
 * 既存の識別子文字列から ProjectId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - プロジェクトIDとして使用するUUID文字列。
 * @returns {ProjectId} 作成されたプロジェクトID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createProjectId = (id: string): ProjectId => createIdentifier<ProjectId>(id);
