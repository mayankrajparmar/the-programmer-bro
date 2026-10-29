import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/** Reads public data as an anonymous visitor (RLS applies). Null when Supabase isn't configured. */
export function createPublicClient(): SupabaseClient | null {
  const config = supabaseConfig();
  return config ? createClient(config.url, config.anonKey, noSession) : null;
}

/**
 * Full access, skipping RLS. Only for server code that has already checked the caller is the
 * admin. Never import this into a Client Component: the key must not reach a browser.
 */
export function createServiceClient(): SupabaseClient | null {
  const config = supabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return config && key ? createClient(config.url, key, noSession) : null;
}
