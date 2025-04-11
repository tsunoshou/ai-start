/**
 * @file システムが対応する言語を表す列挙型
 * @description 国際化 (i18n) でサポートする言語の識別子を示します。
 * 詳細は docs/01_requirements_definition.md の「国際化対応（i18n）機能」を参照。
 *
 * @author tsunoshou
 * @date 2024-07-26
 * @version 1.0.0
 */

/**
 * システムが対応する言語を表す列挙型。
 * 値は ISO 639-1 言語コードに対応します。
 *
 * @enum {string}
 * @property {string} Ja - 日本語。
 * @property {string} En - 英語。
 */
export enum SupportedLanguage {
  Ja = 'ja',
  En = 'en',
}
