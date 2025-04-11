'use client';

// builtin & external
import { ReactNode } from 'react';

// parent & sibling
import { I18N_PROVIDER_CLIENT } from '@core/shared/i18n/client.ts';
import { DEFAULT_LOCALE } from '@core/shared/i18n/config/settings.ts';

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <I18N_PROVIDER_CLIENT locale={DEFAULT_LOCALE}>{children}</I18N_PROVIDER_CLIENT>;
}
