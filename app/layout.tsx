import type { Metadata } from 'next';

import '../presentation/styles/globals.css';

import { DEFAULT_LOCALE } from '@/i18n/config/settings';

import { I18nWrapper } from './I18nWrapper';

export const metadata: Metadata = {
  title: 'AiStart - AI支援によるビジネスプラン作成支援SaaS',
  description:
    'AI支援によるビジネスプラン作成支援SaaSプラットフォーム。ステップバイステップで進めながら、OpenAI APIを活用した対話形式でビジネスプランを作成できます。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>
        <I18nWrapper>{children}</I18nWrapper>
      </body>
    </html>
  );
}
