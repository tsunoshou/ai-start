/**
 * @file 成果物のエクスポート形式を表す列挙型
 * @description プロジェクト成果物などをエクスポートする際のファイル形式を示します。
 * 詳細は docs/01_requirements_definition.md の「成果物管理」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * 成果物のエクスポート形式を表す列挙型。
 *
 * @enum {string}
 * @property {string} Pdf - PDF形式。
 * @property {string} Word - Microsoft Word形式 (.docx)。
 * @property {string} Html - HTML形式。
 */
export enum ExportFormat {
  Pdf = 'PDF',
  Word = 'WORD',
  Html = 'HTML',
}
