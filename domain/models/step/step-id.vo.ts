/**
 * @file ステップIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として StepId を定義します。
 * ステップエンティティを一意に識別するための UUID 形式のIDです。
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
 * ステップIDを表すブランド型。
 * UUID v4 形式の文字列として表現されます。
 *
 * @example
 * import { StepId, generateStepId, createStepId } from '@/domain/models/step/step-id.vo';
 *
 * // 新しい StepId を生成
 * const newId: StepId = generateStepId();
 *
 * // 既存のUUID文字列から StepId を作成
 * const existingId: StepId = createStepId('456e7890-e89b-12d3-a456-426614174001');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createStepId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 *
 * @see {@link Identifier}
 * @see {@link Brand}
 */
export type StepId = Brand<Identifier, 'StepId'>;

/**
 * 新しい StepId を生成します。
 * @returns {StepId} 新しく生成されたステップID。
 */
export const generateStepId = (): StepId => generateIdentifier<StepId>();

/**
 * 既存の識別子文字列から StepId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - ステップIDとして使用するUUID文字列。
 * @returns {StepId} 作成されたステップID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createStepId = (id: string): StepId => createIdentifier<StepId>(id);
