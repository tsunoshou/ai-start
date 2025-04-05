/**
 * @file ビデオコンテンツのプロバイダーを表す列挙型
 * @description ビデオコンテンツがどのプラットフォームでホストされているかを示します。
 * 詳細は docs/01_requirements_definition.md の「ビデオコンテンツ管理要件」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * ビデオコンテンツのプロバイダーを表す列挙型。
 *
 * @enum {string}
 * @property {string} Youtube - YouTube でホストされているビデオ。
 * @property {string} Vimeo - Vimeo でホストされているビデオ。
 * @property {string} Internal - システム内部でホストされているビデオ。
 */
export enum VideoProvider {
  Youtube = 'YOUTUBE',
  Vimeo = 'VIMEO',
  Internal = 'INTERNAL',
}
