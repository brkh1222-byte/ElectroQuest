import Link from "next/link";

const ladder = [
  {
    title: "Prompt engineering",
    who: "No code needed",
    body: "Write a prompt that makes a model pass hidden test cases. Learn how to steer models precisely.",
  },
  {
    title: "Build AI pipelines",
    who: "Some Python",
    body: "Write Python that calls models: retrieval, tools, agents. No API key: the platform covers it.",
  },
  {
    title: "Implement from scratch",
    who: "Developers",
    body: "Build softmax, attention, tokenizers and fine-tuning steps in NumPy, right in your browser.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:py-24">
      <p className="text-sm font-medium text-accent">Free · no API keys · no GPUs</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Learn to build with AI by solving real problems.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted text-pretty">
        LeetCode taught a generation to code. Kaggle taught data science. EvalQuest is the practice ground for
        AI development, open to anyone with a browser.
      </p>
      <Link
        href="/problems"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-accent px-5 font-medium text-accent-foreground hover:opacity-90"
      >
        Start solving
      </Link>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {ladder.map((step) => (
          <div key={step.title} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{step.who}</p>
            <h2 className="mt-2 font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
