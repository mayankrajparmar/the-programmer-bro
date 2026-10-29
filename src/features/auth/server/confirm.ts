import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HOME, LOGIN_PATH } from "./admin-id";
import { createSessionClient } from "./session";

const OTP_TYPES = new Set<EmailOtpType>(["magiclink", "email", "signup", "invite", "recovery"]);

/**
 * Where the emailed sign-in link lands. Supabase's default email sends a `code` (signed in
 * the same browser that asked for the link); a customised template can send `token_hash`.
 * Either way the session is saved in cookies and the admin goes to the News queue.
 */
export async function confirmSignIn(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const supabase = await createSessionClient();

  let signedIn = false;
  if (supabase && code) {
    signedIn = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (supabase && tokenHash && type && OTP_TYPES.has(type)) {
    signedIn = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  const target = signedIn ? ADMIN_HOME : `${LOGIN_PATH}?error=link`;
  return NextResponse.redirect(new URL(target, request.url));
}
