import { Callout } from "@/components/ui/callout";
import { Button } from "@/components/ui/button";
import { signOut } from "../server/actions";
import { SignInForm } from "./sign-in-form";

const MESSAGES: Record<string, string> = {
  link: "That sign-in link didn't work. It may have expired, been used already, or been opened in a different browser. Ask for a new one.",
  "not-admin": "This account can't use the admin pages.",
};

/** /admin/login: the admin signs in with an emailed link. */
export function SignInPage({ error, configured }: { error?: string; configured: boolean }) {
  const message = error ? MESSAGES[error] : undefined;
  return (
    <div className="mx-auto grid max-w-[480px] gap-6 px-4 py-12 sm:px-6 sm:py-16">
      <header className="grid gap-2">
        <h1 className="m-0 font-display text-h1 max-sm:text-[30px]/[38px]">Sign in</h1>
        <p className="m-0 text-text-muted">For the site&apos;s editor, to review AI news.</p>
      </header>

      {message && (
        <Callout kind="warn" title="Couldn't sign you in">
          <p>{message}</p>
        </Callout>
      )}

      {error === "not-admin" ? (
        <form action={signOut}>
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      ) : configured ? (
        <SignInForm />
      ) : (
        <Callout kind="note" title="Not set up here">
          <p>Sign-in isn&apos;t set up on this deployment yet.</p>
        </Callout>
      )}
    </div>
  );
}
