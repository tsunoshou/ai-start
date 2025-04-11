'use client';

// builtin & external
import { ReactNode } from 'react';

// parent & sibling
import { I18N_PROVIDER_CLIENT } from '@/i18n/client';
import { DEFAULT_LOCALE } from '@/i18n/config/settings';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <I18N_PROVIDER_CLIENT locale={DEFAULT_LOCALE}>{children}</I18N_PROVIDER_CLIENT>;
}
