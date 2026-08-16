import katex from "katex";

export interface ContentBlock {
  type: "h2" | "p";
  id?: string;
  text: string;
}

export interface TocEntry {
  id: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseContent(raw: string): {
  blocks: ContentBlock[];
  toc: TocEntry[];
} {
  const blocks: ContentBlock[] = [];
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();

  // Protect multiline math blocks ($$..$$, \[..\], \begin..\end) so the
  // paragraph splitter doesn't break them in half.
  const placeholders: string[] = [];
  const protect = (s: string) =>
    s.replace(
      /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\begin\{([a-zA-Z*]+)\}[\s\S]+?\\end\{\1\}/g,
      (m) => {
        const i = placeholders.push(m) - 1;
        return `\u0000MATH${i}\u0000`;
      },
    );
  const restore = (s: string) =>
    s.replace(/\u0000MATH(\d+)\u0000/g, (_, i) => placeholders[Number(i)]);

  const paragraphs = protect(raw)
    // Google Docs exports some paragraph boundaries as a single newline
    // followed by an invisible Unicode marker instead of a blank line.
    .split(/\n(?:\s*\n+|(?=[\u200B-\u200D\u2060\uFEFF]))/)
    .map((p) =>
      restore(p)
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
        .trim(),
    )
    .filter(Boolean);

  for (const para of paragraphs) {
    if (para.startsWith("## ")) {
      const text = para.slice(3).trim();
      let id = slugify(text) || `sezione-${blocks.length}`;
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;
      blocks.push({ type: "h2", id, text });
      toc.push({ id, text });
    } else {
      blocks.push({ type: "p", text: para });
    }
  }

  return { blocks, toc };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type MathSeg =
  | { kind: "text"; text: string }
  | { kind: "math"; tex: string; display: boolean };

/**
 * Splits text into plain segments and math segments.
 * Supports: $$...$$, \[...\], \(...\), $...$, and \begin{env}...\end{env}.
 */
function tokenizeMath(text: string): MathSeg[] {
  const segs: MathSeg[] = [];
  let i = 0;
  const push = (s: string) => {
    if (!s) return;
    const last = segs[segs.length - 1];
    if (last && last.kind === "text") last.text += s;
    else segs.push({ kind: "text", text: s });
  };

  while (i < text.length) {
    const ch = text[i];

    // $$ ... $$ (display, multiline)
    if (ch === "$" && text[i + 1] === "$") {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) {
        segs.push({ kind: "math", tex: text.slice(i + 2, end), display: true });
        i = end + 2;
        continue;
      }
    }
    // \[ ... \] (display)
    if (ch === "\\" && text[i + 1] === "[") {
      const end = text.indexOf("\\]", i + 2);
      if (end !== -1) {
        segs.push({ kind: "math", tex: text.slice(i + 2, end), display: true });
        i = end + 2;
        continue;
      }
    }
    // \( ... \) (inline)
    if (ch === "\\" && text[i + 1] === "(") {
      const end = text.indexOf("\\)", i + 2);
      if (end !== -1) {
        segs.push({ kind: "math", tex: text.slice(i + 2, end), display: false });
        i = end + 2;
        continue;
      }
    }
    // \begin{env} ... \end{env} (display)
    if (ch === "\\" && text.startsWith("\\begin{", i)) {
      const nameEnd = text.indexOf("}", i + 7);
      if (nameEnd !== -1) {
        const env = text.slice(i + 7, nameEnd);
        const closer = `\\end{${env}}`;
        const end = text.indexOf(closer, nameEnd + 1);
        if (end !== -1) {
          segs.push({
            kind: "math",
            tex: text.slice(i, end + closer.length),
            display: true,
          });
          i = end + closer.length;
          continue;
        }
      }
    }
    // $ ... $ (inline, single line)
    if (ch === "$") {
      const rest = text.slice(i + 1);
      const m = /^([^$\n]+)\$/.exec(rest);
      if (m) {
        segs.push({ kind: "math", tex: m[1], display: false });
        i += 1 + m[0].length;
        continue;
      }
    }

    push(ch);
    i++;
  }
  return segs;
}

/** Renders inline/block KaTeX. Escapes everything else. */
export function renderMathHtml(text: string): string {
  const segs = tokenizeMath(text);
  let html = "";
  for (const seg of segs) {
    if (seg.kind === "math") {
      try {
        html += katex.renderToString(seg.tex, {
          displayMode: seg.display,
          throwOnError: false,
          strict: "ignore",
          trust: false,
          output: "html",
        });
      } catch {
        html += escapeHtml(seg.tex);
      }
    } else {
      html += escapeHtml(seg.text);
    }
  }
  return html.replace(/\n/g, "<br />");
}


export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
