import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { updateSession } from './lib/supabase/middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, handle Supabase auth and session refresh
  const { supabaseResponse, user } = await updateSession(request);

  // Check auth for protected routes
  const url = request.nextUrl.clone();
  // Strip locale prefix to check the base path
  const pathname = url.pathname;
  const isLoginPage = pathname.endsWith('/login');
  const isPublicRoute = pathname.match(/\.(.*)$/); // skip static files

  const localeMatch = pathname.match(/^\/(bn|en)/);
  const locale = localeMatch ? localeMatch[1] : 'bn';

  if (!isPublicRoute) {
    if (!user && !isLoginPage) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    if (user && isLoginPage) {
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Next, handle Next-Intl routing
  const intlResponse = handleI18nRouting(request);

  // Merge Supabase cookies into the Intl response so session refresh persists
  const supabaseCookies = supabaseResponse.cookies.getAll();
  supabaseCookies.forEach(cookie => {
    const { name, value, ...options } = cookie;
    intlResponse.cookies.set(name, value, options as any);
  });

  return intlResponse;
}

export const config = {
  // Match only internationalized pathnames and exclude internal Next.js/static files
  matcher: ['/', '/(bn|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)']
};
