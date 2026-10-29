import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseConfig } from "@/lib/supabase/config";
import { isAdminId, LOGIN_PATH } from "./admin-id";

/*
 * The signed-in session, kept in cookies by @supabase/ssr. In Stage 1 the only account is the
 * admin's: public sign-ups are off, and the admin is whoever's user id is ADMIN_USER_ID.
 */

/** A Supabase client acting as the visitor, from their session cookies. Null if not configured. */
export async function createSessionClient(): Promise<SupabaseClient | null> {
  // Read cookies first, even when unconfigured, so pages using this always render per request.
  const cookieStore = await cookies();
  const config = supabaseConfig();
  if (!config) return null;
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. The proxy (src/proxy.ts) refreshes sessions.
        }
      },
    },
  });
}

export interface AdminUser {
  id: string;
  email: string | null;
}

/** True when sign-in can work here: Supabase and the admin's user id are both configured. */
export function signInConfigured(): boolean {
  return supabaseConfig() !== null && Boolean(process.env.ADMIN_USER_ID?.trim());
}

/**
 * Whoever is signed in, or null. Verifies the session token's signature (getClaims), so a
 * forged cookie can't pass.
 */
export async function getSignedInUser(): Promise<(AdminUser & { isAdmin: boolean }) | null> {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    isAdmin: isAdminId(claims.sub),
  };
}

/**
 * The admin, or a redirect to the sign-in page. Call it in every admin page and action:
 * the proxy's redirect is a convenience, not a security check.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSignedInUser();
  if (!user) redirect(LOGIN_PATH);
  if (!user.isAdmin) redirect(`${LOGIN_PATH}?error=not-admin`);
  return { id: user.id, email: user.email };
}
