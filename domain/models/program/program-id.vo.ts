/**
 * @file プログラムIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ProgramId を定義します。
 * プログラムエンティティを一意に識別するための UUID 形式のIDです。
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
 * プログラムIDを表すブランド型。
 * UUID v4 形式の文字列として表現されます。
 *
 * @example
 * import { ProgramId, generateProgramId, createProgramId } from '@/domain/models/program/program-id.vo';
 *
 * // 新しい ProgramId を生成
 * const newId: ProgramId = generateProgramId();
 *
 * // 既存のUUID文字列から ProgramId を作成
 * const existingId: ProgramId = createProgramId('123e4567-e89b-12d3-a456-426614174000');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createProgramId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 *
 * @see {@link Identifier}
 * @see {@link Brand}
 */
export type ProgramId = Brand<Identifier, 'ProgramId'>;

/**
 * 新しい ProgramId を生成します。
 * @returns {ProgramId} 新しく生成されたプログラムID。
 */
export const generateProgramId = (): ProgramId => generateIdentifier<ProgramId>();

/**
 * 既存の識別子文字列から ProgramId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - プログラムIDとして使用するUUID文字列。
 * @returns {ProgramId} 作成されたプログラムID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createProgramId = (id: string): ProgramId => createIdentifier<ProgramId>(id);
