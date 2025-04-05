/**
 * @file ステップIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として StepId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * プログラム内のステップ（学習・作業単位）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `steps` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'StepId'>} StepId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { StepId } from '@/domain/models/step/step-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateStepId(): StepId;
 * declare function createStepId(id: string): StepId; // バリデーション含む想定
 *
 * const stepId1: StepId = generateStepId();
 * const stepId2: StepId = createStepId('jkl01234-e89b-12d3-a456-426614174000');
 *
 * function getStep(id: StepId) {
 *   // ... StepId を使ってステップを取得する処理 ...
 *   console.log('Fetching step with ID:', id);
 * }
 *
 * getStep(stepId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { ProgramId } from '@/domain/models/program/program-id.vo';
 * declare const programId: ProgramId;
 * // getStep(programId); // -> Compile Error!
 * ```
 */
export type StepId = Brand<Identifier, 'StepId'>;
