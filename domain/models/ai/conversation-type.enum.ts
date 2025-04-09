/**
 * @file AIとの会話種別を表す列挙型
 * @description AI支援機能における対話のコンテキストや目的を示します。
 * 詳細は docs/01_requirements_definition.md の「会話種別対応要件」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * AIとの会話種別を表す列挙型。
 *
 * @enum {string}
 * @property {string} Initial - ステップ開始時の導入と目的説明に特化した会話。
 * @property {string} Continuous - 対話の流れを維持し発展させる通常の会話。
 * @property {string} Checkpoint - 現在の成果物を評価し方向性を確認する会話。
 * @property {string} OutputCreation - 最終成果物の作成と整形に特化した会話。
 */
export enum ConversationType {
  Initial = 'INITIAL',
  Continuous = 'CONTINUOUS',
  Checkpoint = 'CHECKPOINT',
  OutputCreation = 'OUTPUT_CREATION',
}
