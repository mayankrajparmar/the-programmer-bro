/*
 * Supabase settings from the environment. Every caller handles "not configured"
 * (local development and CI run without a database), so a missing setting shows an
 * empty state instead of breaking the build.
 */

export interface SupabaseConfig {
  url: string;
  /** The public anon (or "publishable") key. Safe in the browser: RLS decides what it can read. */
  anonKey: string;
}

export function supabaseConfig(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): SupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
}
