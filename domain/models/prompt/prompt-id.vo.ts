/**
 * @file プロンプトIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として PromptId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * AIプロンプトテンプレートの一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `prompts` テーブルなどの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'PromptId'>} PromptId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { PromptId } from '@/domain/models/prompt/prompt-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generatePromptId(): PromptId;
 * declare function createPromptId(id: string): PromptId; // バリデーション含む想定
 *
 * const promptId1: PromptId = generatePromptId();
 * const promptId2: PromptId = createPromptId('def45678-e89b-12d3-a456-426614174000');
 *
 * function getPrompt(id: PromptId) {
 *   // ... PromptId を使ってプロンプトテンプレートを取得する処理 ...
 *   console.log('Fetching prompt with ID:', id);
 * }
 *
 * getPrompt(promptId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { ProjectId } from '@/domain/models/project/project-id.vo';
 * declare const projectId: ProjectId;
 * // getPrompt(projectId); // -> Compile Error!
 * ```
 */
export type PromptId = Brand<Identifier, 'PromptId'>;
