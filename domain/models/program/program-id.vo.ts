/**
 * @file プログラムIDを表す値オブジェクトの型定義
 * @description `Identifier` 型を基にしたブランド型として ProgramId を定義します。
 *
 * @author tsunoshou
 * @date 2024-03-29
 * @version 1.0.0
 */

import { Identifier } from '@/shared/types/common.types';
import { Brand } from '@/shared/types/utility.types';

/**
 * 学習プログラム（コース）の一意な識別子を表す型。
 * UUID形式の文字列を基にしたブランド型です。
 * データベース上の `programs` テーブルの主キーに対応することを想定しています。
 *
 * @typedef {Brand<Identifier, 'ProgramId'>} ProgramId
 * @see {@link Identifier} - ベースとなる識別子の型定義
 * @see {@link Brand} - 型安全性を高めるためのユーティリティ型
 *
 * @example
 * ```typescript
 * import { ProgramId } from '@/domain/models/program/program-id.vo';
 * import { Identifier } from '@/shared/types/common.types';
 *
 * // IDを安全に生成または変換する関数 (別途定義・実装が必要)
 * declare function generateProgramId(): ProgramId;
 * declare function createProgramId(id: string): ProgramId; // バリデーション含む想定
 *
 * const programId1: ProgramId = generateProgramId();
 * const programId2: ProgramId = createProgramId('ghi78901-e89b-12d3-a456-426614174000');
 *
 * function getProgram(id: ProgramId) {
 *   // ... ProgramId を使ってプログラムを取得する処理 ...
 *   console.log('Fetching program with ID:', id);
 * }
 *
 * getProgram(programId1);
 *
 * // 型安全性の例: 他のID型とは互換性がない
 * import { StepId } from '@/domain/models/step/step-id.vo'; // 仮
 * declare const stepId: StepId;
 * // getProgram(stepId); // -> Compile Error!
 * ```
 */
export type ProgramId = Brand<Identifier, 'ProgramId'>;
