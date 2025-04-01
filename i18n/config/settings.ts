import { ENV } from '../../config/environment';

/**
 * デフォルトのロケール
 * @type {string}
 */
export const DEFAULT_LOCALE = ENV.DEFAULT_LOCALE;

/**
 * サポートされているロケールのリスト
 * @type {string[]}
 */
export const SUPPORTED_LOCALES = ENV.SUPPORTED_LOCALES.split(',');

/**
 * ロケールが有効かどうかを確認する
 * @param {string} locale - 確認するロケール
 * @returns {boolean} ロケールが有効な場合はtrue、そうでない場合はfalse
 */
export const IS_VALID_LOCALE = (locale: string): boolean => {
  return SUPPORTED_LOCALES.includes(locale);
};

/**
 * URLからロケールを取得する
 * @param {string} url - ロケールを取得するURL
 * @returns {string | undefined} 取得したロケール、または存在しない場合はundefined
 */
export const GET_LOCALE_FROM_URL = (url: string): string | undefined => {
  const localeRegex = new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})`);
  const match = url.match(localeRegex);
  return match ? match[1] : undefined;
};

/**
 * 指定されたロケールを使用してURLを作成する
 * @param {string} url - 基本URL
 * @param {string} locale - 使用するロケール
 * @returns {string} ロケール付きのURL
 */
export const CREATE_LOCALIZED_URL = (url: string, locale: string): string => {
  // URLがすでにロケールで始まっている場合は、そのロケールを削除
  const urlWithoutLocale = url.replace(new RegExp(`^/(${SUPPORTED_LOCALES.join('|')})`), '');

  return locale === DEFAULT_LOCALE ? urlWithoutLocale : `/${locale}${urlWithoutLocale}`;
};
