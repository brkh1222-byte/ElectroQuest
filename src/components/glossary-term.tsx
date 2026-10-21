import type { Nodes, Root } from "mdast";
import Link from "next/link";
import type { ReactNode } from "react";
import { findGlossaryEntry, type GlossaryEntry } from "@/lib/glossary";

/** Glossary text, with `backtick` spans shown as code. */
export function GlossaryText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-muted/15 px-1 font-mono text-[0.875em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * A bold lesson term that links to its glossary entry. Hovering or focusing it shows the short
 * definition, so a reader can look a word up without leaving the lesson.
 */
export function GlossaryTerm({ entry, children }: { entry: GlossaryEntry; children: ReactNode }) {
  return (
    <span className="group relative">
      <Link
        href={`/glossary#${entry.id}`}
        className="underline decoration-muted decoration-dotted decoration-1 underline-offset-4 hover:text-accent hover:decoration-accent focus-visible:text-accent"
      >
        {children}
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-1.5 block w-72 max-w-[80vw] rounded-lg border border-border bg-surface p-3 text-left text-sm leading-snug font-normal text-foreground opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        <span className="block font-medium">{entry.term}</span>
        <span className="mt-1 block text-muted">
          <GlossaryText text={entry.definition} />
        </span>
        <span className="mt-2 block text-xs text-accent">Click for an example and more →</span>
      </span>
    </span>
  );
}

function plainText(node: Nodes): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  if ("children" in node) return node.children.map((child) => plainText(child)).join("");
  return "";
}

function containsLink(node: Nodes): boolean {
  if (node.type === "link" || node.type === "linkReference") return true;
  return "children" in node && node.children.some((child) => containsLink(child));
}

/**
 * Remark plugin: marks the first bold occurrence of each known glossary term with a
 * `data-glossary` attribute, which the Markdown `strong` renderer turns into a GlossaryTerm.
 * Bold text in headings and links is left alone.
 */
export function remarkGlossary() {
  return (tree: Root) => {
    const linked = new Set<string>();
    const visit = (node: Nodes) => {
      if (node.type === "heading" || node.type === "link" || node.type === "linkReference") return;
      if (node.type === "strong") {
        const entry = findGlossaryEntry(plainText(node));
        if (entry && !linked.has(entry.id) && !containsLink(node)) {
          linked.add(entry.id);
          node.data = { ...node.data, hProperties: { ...node.data?.hProperties, dataGlossary: entry.id } };
        }
        return;
      }
      if ("children" in node) for (const child of node.children) visit(child);
    };
    visit(tree);
  };
}
