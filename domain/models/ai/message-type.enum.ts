/**
 * @file チャットメッセージのタイプを表す列挙型
 * @description AI支援機能のチャットインターフェースにおけるメッセージの送信元を示します。
 * 詳細は docs/01_requirements_definition.md の「AIチャット対話インターフェース要件」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * チャットメッセージのタイプを表す列挙型。
 *
 * @enum {string}
 * @property {string} System - システムからの通知や情報メッセージ。
 * @property {string} User - ユーザーが入力したメッセージ。
 * @property {string} Assistant - AIアシスタントからの応答メッセージ。
 */
export enum MessageType {
  System = 'SYSTEM',
  User = 'USER',
  Assistant = 'ASSISTANT',
}
