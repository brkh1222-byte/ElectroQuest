import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, LineChart } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "../ui/button";
import { cardClass } from "../ui/card";

/** What anonymous visitors see on /me: why an account helps, and that lessons work without one. */
export function SignInPrompt({ startHref }: { startHref: string }) {
  return (
    <section className={cardClass({ className: "mt-6 px-5 py-10 text-center sm:px-8" })}>
      <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-xl bg-accent/10 text-accent">
        <LineChart className="size-6" strokeWidth={1.75} />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-balance">Sign in to see your progress</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted text-pretty">
        With a free account, EvalQuest saves the problems you solve, keeps your daily streak, and remembers where
        you stopped, so you can always pick up from there.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
        <SignInButton mode="modal" forceRedirectUrl="/me">
          <button type="button" className={buttonClass({ className: "h-10" })}>
            Sign in or create an account
          </button>
        </SignInButton>
        <Link
          href={startHref}
          className="inline-flex items-center gap-1 rounded-sm text-sm text-muted underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
        >
          Or start lesson 1 without an account
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2} />
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted">You can read every lesson without an account.</p>
    </section>
  );
}
