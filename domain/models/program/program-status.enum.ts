/**
 * @file プログラムの公開状態を表す列挙型
 * @description プログラムがユーザーに公開されているか、下書き状態かを示します。
 * 詳細は docs/01_requirements_definition.md を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * プログラムの公開状態を表す列挙型。
 *
 * @enum {string}
 * @property {string} Public - 一般ユーザーに公開されている状態。
 * @property {string} Private - 管理者のみがアクセス可能な下書きまたは非公開状態。
 */
export enum ProgramStatus {
  Public = 'PUBLIC',
  Private = 'PRIVATE',
}
