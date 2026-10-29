import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { ADMIN_HOME, isAdminId, LOGIN_PATH } from "./admin-id";

/** Pages under /admin that work without signing in. */
export function isPublicAdminPath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname.startsWith("/admin/auth/");
}

/**
 * Runs before every /admin request: refreshes the session cookies (Server Components can't),
 * sends signed-out visitors to the sign-in page, and signed-in ones away from it.
 * Pages and actions still check the admin themselves.
 */
export async function updateAdminSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (!config) return isPublicAdminPath(pathname) ? response : redirectTo(LOGIN_PATH);

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId && !isPublicAdminPath(pathname)) return redirectTo(LOGIN_PATH);
  if (isAdminId(userId) && pathname === LOGIN_PATH) return redirectTo(ADMIN_HOME);
  return response;

  function redirectTo(path: string) {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    // Keep any cookies the refresh just set (or cleared).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
}
