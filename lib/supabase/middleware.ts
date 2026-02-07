import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars missing in middleware; skipping session update');
    return redirectLegacyPaths(request, response);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    });

    await supabase.auth.getUser();
  } catch (error) {
    console.error('Middleware updateSession error:', error);
    return redirectLegacyPaths(request, response);
  }

  return redirectLegacyPaths(request, response);
}

function redirectLegacyPaths(request: NextRequest, response: NextResponse): NextResponse {
  const url = request.nextUrl.clone();
  if (url.pathname === '/auth/login') {
    url.pathname = '/login';
    return NextResponse.redirect(url, 308);
  }
  if (url.pathname === '/auth/signup') {
    url.pathname = '/signup';
    return NextResponse.redirect(url, 308);
  }
  return response;
}
