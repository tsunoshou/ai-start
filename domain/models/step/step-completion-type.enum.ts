/**
 * @file ステップの完了条件種別を表す列挙型
 * @description ステップを完了するために必要な条件の種類を示します。
 * 詳細は docs/01_requirements_definition.md の「ステップ完了条件評価」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * ステップの完了条件種別を表す列挙型。
 *
 * @enum {string}
 * @property {string} OutputCreation - 特定の成果物を作成することが完了条件。
 * @property {string} CheckCompletion - チェックリスト項目などを完了することが条件。
 * @property {string} RequiredViewing - 紐づくコンテンツ（ビデオなど）の視聴完了が条件。
 * @property {string} ManualApproval - 管理者による手動承認が完了条件。
 */
export enum StepCompletionType {
  OutputCreation = 'OUTPUT_CREATION',
  CheckCompletion = 'CHECK_COMPLETION',
  RequiredViewing = 'REQUIRED_VIEWING',
  ManualApproval = 'MANUAL_APPROVAL',
}
