"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { sendSignInLink, type SignInState } from "../server/actions";

/** Email field that asks for a one-time sign-in link. */
export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(sendSignInLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div role="status" className="grid gap-2 rounded-lg border border-border bg-surface p-6">
        <p className="m-0 flex items-center gap-2 font-display text-title">
          <MailCheck aria-hidden className="size-5 text-success" />
          Check your email
        </p>
        <p className="m-0">
          If {state.email} can sign in here, a link is on its way. Open it in this browser; it works
          once and expires in an hour.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="grid gap-4" noValidate>
      <Field
        label="Email"
        htmlFor="email"
        hint={error ? undefined : "We'll email you a one-time sign-in link."}
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
        />
      </Field>
      {error && (
        <p id="email-error" role="alert" className="m-0 text-small text-danger">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
