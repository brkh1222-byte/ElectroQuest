import { isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { getGlossaryEntry } from "@/lib/glossary";
import { GlossaryTerm, remarkGlossary } from "./glossary-term";
import { PythonTry } from "./python-try";
import { TokenViewer } from "./token-viewer";
import { TryIt, type TryItOptions } from "./try-it";

/** The language and text of a fenced code block, or null for other <pre> content. */
function codeBlock(children: ReactNode) {
  const code = isValidElement(children) ? (children as ReactElement<{ className?: string; children?: ReactNode }>) : null;
  const lang = code?.props.className?.match(/language-([\w-]+)/)?.[1];
  return lang ? { lang, text: String(code.props.children ?? "") } : null;
}

const directives: Record<string, keyof TryItOptions> = {
  temperature: "temperature",
  maxTokens: "maxOutputTokens",
  repeat: "repeat",
};

/**
 * Text of a ```try block: optional `@temperature 1.2` / `@maxTokens 20` / `@repeat 3` lines,
 * the system prompt, a line with ---, then the user message.
 */
function parseTryBlock(text: string) {
  const options: TryItOptions = {};
  const body = text.replace(/^@(\w+)\s+([\d.]+)\s*$\n?/gm, (line, name: string, value: string) => {
    const key = directives[name];
    if (!key) return line;
    options[key] = Number(value);
    return "";
  });
  const [system, user = ""] = body.split(/^---$/m);
  return { system: system.trim(), user: user.trim(), options };
}

/**
 * `tryItSlug` turns ```try blocks into live playgrounds backed by that problem's model.
 * `glossary` (on by default) links the first bold use of each glossary term to /glossary.
 */
export function Markdown({
  children,
  tryItSlug,
  glossary = true,
}: {
  children: string;
  tryItSlug?: string;
  glossary?: boolean;
}) {
  const components: Components = {
    pre({ children: inner, ...props }) {
      const block = codeBlock(inner);
      if (block?.lang === "tokens") return <TokenViewer initial={block.text.trim()} />;
      if (block?.lang === "python-try") return <PythonTry initial={block.text.replace(/\s+$/, "")} />;
      if (block?.lang === "try" && tryItSlug) {
        const { system, user, options } = parseTryBlock(block.text);
        return <TryIt slug={tryItSlug} system={system} user={user} options={options} />;
      }
      return <pre {...props}>{inner}</pre>;
    },
    strong({ node, children: inner, ...props }) {
      const id = node?.properties?.dataGlossary;
      const entry = typeof id === "string" ? getGlossaryEntry(id) : undefined;
      const bold = <strong {...props}>{inner}</strong>;
      return entry ? <GlossaryTerm entry={entry}>{bold}</GlossaryTerm> : bold;
    },
  };
  return (
    <div className="prose-content">
      <ReactMarkdown
        remarkPlugins={glossary ? [remarkGfm, remarkMath, remarkGlossary] : [remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
