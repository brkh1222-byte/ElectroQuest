import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryText } from "@/components/glossary-term";
import { getGlossaryEntry, sortedGlossary, type GlossaryEntry } from "@/lib/glossary";
import { stepHref } from "@/lib/step-href";
import { listTracks } from "@/lib/tracks";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Every AI word used in the EvalQuest lessons, explained in simple English with an everyday example.",
};

type LessonLink = { href: string; title: string; track: string; number: number; order: number };

/** Each problem's lesson, in the first track that lists it. `order` is the reading order across tracks. */
async function lessonLinks() {
  const links = new Map<string, LessonLink>();
  for (const track of await listTracks()) {
    for (const [i, step] of track.steps.entries()) {
      if (!step.lessonTitle || links.has(step.slug)) continue;
      links.set(step.slug, {
        href: stepHref(track.slug, step),
        title: step.lessonTitle,
        track: track.title,
        number: i + 1,
        order: links.size,
      });
    }
  }
  return links;
}

/** Entries grouped by first letter, A to Z. */
function byLetter(entries: GlossaryEntry[]) {
  const groups = new Map<string, GlossaryEntry[]>();
  for (const entry of entries) {
    const letter = entry.term[0].toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }
  return [...groups];
}

export default async function GlossaryPage() {
  const lessons = await lessonLinks();
  const groups = byLetter(sortedGlossary());

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Glossary</h1>
      <p className="mt-1 text-muted text-pretty">
        Every AI word used in the lessons, in simple English, with an everyday example. Each entry links to the
        lesson that teaches it.
      </p>

      <nav aria-label="Jump to a letter" className="mt-6 flex flex-wrap gap-1.5">
        {groups.map(([letter]) => (
          <a
            key={letter}
            href={`#letter-${letter}`}
            className="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium hover:border-accent hover:text-accent"
          >
            {letter}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-10">
        {groups.map(([letter, entries]) => (
          <section key={letter} aria-labelledby={`letter-${letter}`}>
            <h2 id={`letter-${letter}`} className="scroll-mt-4 text-sm font-semibold tracking-wide text-muted">
              {letter}
            </h2>
            <div className="mt-3 space-y-3">
              {entries.map((entry) => (
                <Entry key={entry.id} entry={entry} lessons={lessons} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function Entry({ entry, lessons }: { entry: GlossaryEntry; lessons: Map<string, LessonLink> }) {
  const usedIn = entry.lessons
    .map((slug) => lessons.get(slug))
    .filter((l): l is LessonLink => !!l)
    .sort((a, b) => a.order - b.order);
  const related = (entry.related ?? []).map(getGlossaryEntry).filter((e): e is GlossaryEntry => !!e);
  return (
    <article
      id={entry.id}
      className="scroll-mt-4 rounded-xl border border-border bg-surface p-5 target:border-accent target:ring-2 target:ring-accent/30"
    >
      <h3 className="text-lg font-semibold">{entry.term}</h3>
      <p className="mt-1.5 text-pretty">
        <GlossaryText text={entry.definition} />
      </p>
      <p className="mt-2 text-sm text-muted text-pretty">
        <span className="font-medium text-foreground">Example: </span>
        <GlossaryText text={entry.example} />
      </p>
      {usedIn.length > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span className="text-muted">Used in:</span>
          {usedIn.map((lesson, i) => (
            <span key={lesson.href}>
              <Link href={lesson.href} className="text-accent hover:underline">
                {lesson.title}
              </Link>
              <span className="text-muted">
                {" "}
                ({lesson.track}, lesson {lesson.number}){i < usedIn.length - 1 && ","}
              </span>
            </span>
          ))}
        </div>
      )}
      {related.length > 0 && (
        <p className="mt-1.5 text-sm text-muted">
          See also:{" "}
          {related.map((r, i) => (
            <span key={r.id}>
              <a href={`#${r.id}`} className="hover:text-foreground hover:underline">
                {r.term}
              </a>
              {i < related.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}
