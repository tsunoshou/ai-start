import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';

import { DEFAULT_LOCALE, GET_LOCALE_FROM_URL, IS_VALID_LOCALE } from './i18n/config/settings';

// 国際化対応のためのミドルウェア
export function middleware(request: NextRequest) {
  // リクエストURLからロケールを取得
  const pathname = request.nextUrl.pathname;
  const locale = GET_LOCALE_FROM_URL(pathname);

  // ユーザー設定のロケールをCookieから取得（存在する場合）
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // 以下の場合はリダイレクトを行う:
  // 1. URLにロケールが含まれていない場合
  // 2. Cookieに有効なロケールが保存されている場合
  if (!locale && cookieLocale && IS_VALID_LOCALE(cookieLocale)) {
    // デフォルトロケールの場合はロケールプレフィックスなしのURLへ
    if (cookieLocale === DEFAULT_LOCALE) {
      return NextResponse.next();
    }

    // ロケールを含むURLへリダイレクト
    return NextResponse.redirect(new URL(`/${cookieLocale}${pathname}`, request.url));
  }

  // URLに無効なロケールが含まれている場合、デフォルトロケールへリダイレクト
  if (locale && !IS_VALID_LOCALE(locale)) {
    const newPathname = pathname.replace(`/${locale}`, '') || '/';
    return NextResponse.redirect(new URL(newPathname, request.url));
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパス設定
export const config = {
  // 静的ファイルと_nextパスを除外
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
