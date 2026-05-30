import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { updateSession } from './lib/supabase/middleware';
import { createServerClient } from "@supabase/ssr";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // First, handle Supabase auth and session refresh
  const { supabaseResponse, user } = await updateSession(request);

  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const isPublicRoute = pathname.match(/\.(.*)$/); // skip static files

  const localeMatch = pathname.match(/^\/(bn|en)/);
  const locale = localeMatch ? localeMatch[1] : 'bn';

  // Strip the locale prefix to get the base path
  const basePath = pathname.replace(/^\/(bn|en)/, '') || '/';

  const isLoginPage = basePath === '/login';
  // A bare locale root is exactly /bn or /en (nothing after)
  const isBareLocaleRoot = pathname === `/${locale}` || pathname === `/${locale}/`;

  if (!isPublicRoute) {
    // --- Not logged in: redirect to login unless already there ---
    if (!user && !isLoginPage) {
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }

    // --- Logged in on login page: redirect based on role ---
    if (user && isLoginPage) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            }
          }
        }
      );
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = profile?.role;
      url.pathname = (role === 'admin' || role === 'manager')
        ? `/${locale}/dashboard`
        : `/${locale}/orders`;
      return NextResponse.redirect(url);
    }

    // --- Logged in but hitting bare locale root /bn or /en: redirect to correct page ---
    if (user && isBareLocaleRoot) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            }
          }
        }
      );
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = profile?.role;
      url.pathname = (role === 'admin' || role === 'manager')
        ? `/${locale}/dashboard`
        : `/${locale}/orders`;
      return NextResponse.redirect(url);
    }

    // --- Not logged in on bare locale root: redirect to login ---
    if (!user && isBareLocaleRoot) {
      url.pathname = `/${locale}/login`;
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
  matcher: ['/', '/(bn|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)', '/(bn|en)']
};
