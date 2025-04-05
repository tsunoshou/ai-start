/**
 * @file プロンプトIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として PromptId を定義します。
 * プロンプトテンプレートエンティティを一意に識別するための UUID 形式のIDです。
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
 * プロンプトIDを表すブランド型。
 * UUID v4 形式の文字列として表現されます。
 *
 * @example
 * import { PromptId, generatePromptId, createPromptId } from '@/domain/models/prompt/prompt-id.vo';
 *
 * // 新しい PromptId を生成
 * const newId: PromptId = generatePromptId();
 *
 * // 既存のUUID文字列から PromptId を作成
 * const existingId: PromptId = createPromptId('abc12345-e89b-12d3-a456-426614174003');
 *
 * // UUID形式でない場合はエラー
 * // const invalidId = createPromptId('invalid-uuid'); // -> Error
 *
 * console.log(newId);
 * console.log(existingId);
 *
 * @see {@link Identifier}
 * @see {@link Brand}
 */
export type PromptId = Brand<Identifier, 'PromptId'>;

/**
 * 新しい PromptId を生成します。
 * @returns {PromptId} 新しく生成されたプロンプトID。
 */
export const generatePromptId = (): PromptId => generateIdentifier<PromptId>();

/**
 * 既存の識別子文字列から PromptId を作成します。
 * UUID v4 形式である必要があります。
 * @param {string} id - プロンプトIDとして使用するUUID文字列。
 * @returns {PromptId} 作成されたプロンプトID。
 * @throws {Error} UUID v4 形式でない場合にエラーをスローします。
 */
export const createPromptId = (id: string): PromptId => createIdentifier<PromptId>(id);
