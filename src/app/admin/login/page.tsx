import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPage, signInConfigured } from "@/features/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function Page({ searchParams }: PageProps<"/admin/login">) {
  const configured = signInConfigured();
  return (
    <Suspense fallback={<SignInPage configured={configured} />}>
      <SignInWithMessage searchParams={searchParams} configured={configured} />
    </Suspense>
  );
}

/** Reads ?error=… (a request-time value), so it streams in behind the static form. */
async function SignInWithMessage({
  searchParams,
  configured,
}: {
  searchParams: PageProps<"/admin/login">["searchParams"];
  configured: boolean;
}) {
  const { error } = await searchParams;
  return (
    <SignInPage error={typeof error === "string" ? error : undefined} configured={configured} />
  );
}
