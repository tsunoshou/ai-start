'use client';

import { createI18nClient } from 'next-international/client';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config/settings';

// クライアントサイドのi18n設定
export const {
  useI18n: USE_I18N,
  useScopedI18n: USE_SCOPED_I18N,
  I18nProviderClient: I18N_PROVIDER_CLIENT,
  useCurrentLocale: USE_CURRENT_LOCALE,
  useChangeLocale: USE_CHANGE_LOCALE,
} = createI18nClient({
  ja: () => import('./locales/ja/common.json'),
  en: () => import('./locales/en/common.json'),
});

// 言語設定関連のカスタムフック
export const USE_LANGUAGE_SETTINGS = () => {
  const currentLocale = USE_CURRENT_LOCALE();
  const changeLocale = USE_CHANGE_LOCALE();

  return {
    currentLocale,
    defaultLocale: DEFAULT_LOCALE,
    supportedLocales: SUPPORTED_LOCALES,
    changeLocale,
  };
};
