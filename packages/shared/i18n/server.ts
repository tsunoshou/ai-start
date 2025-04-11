import { createI18nServer } from 'next-international/server';

// サーバーサイドのi18n設定
export const { getI18n: GET_I18N, getScopedI18n: GET_SCOPED_I18N } = createI18nServer({
  ja: () => import('./locales/ja/common.json'),
  en: () => import('./locales/en/common.json'),
});
