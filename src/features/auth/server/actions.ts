"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOGIN_PATH } from "./admin-id";
import { createSessionClient } from "./session";

export type SignInState =
  { status: "idle" } | { status: "sent"; email: string } | { status: "error"; message: string };

const EmailSchema = z.email("Enter a valid email address.");

/** The site's address as the visitor sees it, so preview deployments get links to themselves. */
async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Emails a one-time sign-in link. It never creates an account, and it says the same thing
 * whether or not the address has one, so the form can't be used to discover accounts.
 */
export async function sendSignInLink(_previous: SignInState, form: FormData): Promise<SignInState> {
  const parsed = EmailSchema.safeParse(String(form.get("email") ?? "").trim());
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter an email." };
  }

  const supabase = await createSessionClient();
  if (!supabase) return { status: "error", message: "Sign-in isn't set up on this deployment." };

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${await requestOrigin()}/admin/auth/confirm`,
    },
  });
  if (error?.status === 429) {
    return {
      status: "error",
      message: "Too many sign-in emails were sent. Wait a few minutes, then try again.",
    };
  }
  // A 4xx here usually means the address has no account (sign-ups are off). Answer as if
  // the email went out. Network and server errors are worth saying, so they can retry.
  const status = error?.status ?? 0;
  if (error && !(status >= 400 && status < 500)) {
    console.error(`Sign-in link: ${error.code ?? status}: ${error.message}`);
    return { status: "error", message: "Couldn't send the link just now. Try again in a minute." };
  }
  if (error) console.warn(`Sign-in link refused: ${error.code ?? status}`);
  return { status: "sent", email: parsed.data };
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut();
  redirect(LOGIN_PATH);
}
