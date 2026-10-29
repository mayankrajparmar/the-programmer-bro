import { afterEach, describe, expect, it, vi } from "vitest";
import { supabaseConfig } from "@/lib/supabase/config";
import { isAdminId } from "./admin-id";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAdminId", () => {
  it("matches only the configured admin", () => {
    vi.stubEnv("ADMIN_USER_ID", " 7d0c1e5a-1111-4222-8333-944455556666 ");
    expect(isAdminId("7d0c1e5a-1111-4222-8333-944455556666")).toBe(true);
    expect(isAdminId("someone-else")).toBe(false);
    expect(isAdminId(undefined)).toBe(false);
  });

  it("lets nobody in until ADMIN_USER_ID is set", () => {
    vi.stubEnv("ADMIN_USER_ID", "");
    expect(isAdminId("")).toBe(false);
    expect(isAdminId("anyone")).toBe(false);
  });
});

describe("supabaseConfig", () => {
  it("needs both the URL and the anon key", () => {
    expect(
      supabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "key",
      }),
    ).toEqual({ url: "https://abc.supabase.co", anonKey: "key" });
    expect(supabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" })).toBeNull();
    expect(supabaseConfig({})).toBeNull();
  });
});
