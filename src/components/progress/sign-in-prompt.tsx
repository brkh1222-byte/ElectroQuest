import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

/** What anonymous visitors see on /me: why an account helps, and that lessons work without one. */
export function SignInPrompt({ startHref }: { startHref: string }) {
  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-8 text-center">
      <h2 className="text-xl font-semibold">Sign in to see your progress</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted text-pretty">
        With a free account, EvalQuest saves the problems you solve, keeps your daily streak, and remembers where
        you stopped, so you can always pick up from there.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
        <SignInButton mode="modal" forceRedirectUrl="/me">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Sign in or create an account
          </button>
        </SignInButton>
        <Link href={startHref} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          Or start lesson 1 without an account →
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted">You can read every lesson without an account.</p>
    </section>
  );
}
