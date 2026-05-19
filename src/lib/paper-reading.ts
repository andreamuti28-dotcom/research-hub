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

  const paragraphs = raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

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

/** Renders inline KaTeX ($...$) and block ($$...$$). Escapes the rest. */
export function renderMathHtml(text: string): string {
  const blockRegex = /\$\$([^$]+)\$\$/g;
  const inlineRegex = /\$([^$\n]+)\$/g;

  let html = "";
  let lastIndex = 0;

  // Block math first
  const blockMatches: { start: number; end: number; tex: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(text))) {
    blockMatches.push({ start: m.index, end: blockRegex.lastIndex, tex: m[1] });
  }

  const segments: { text: string; math?: { tex: string; display: boolean } }[] =
    [];
  let cursor = 0;
  for (const bm of blockMatches) {
    if (bm.start > cursor) segments.push({ text: text.slice(cursor, bm.start) });
    segments.push({ text: "", math: { tex: bm.tex, display: true } });
    cursor = bm.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  for (const seg of segments) {
    if (seg.math) {
      try {
        html += katex.renderToString(seg.math.tex, {
          displayMode: seg.math.display,
          throwOnError: false,
        });
      } catch {
        html += escapeHtml(`$$${seg.math.tex}$$`);
      }
      continue;
    }
    // inline math within text
    let innerCursor = 0;
    let im: RegExpExecArray | null;
    inlineRegex.lastIndex = 0;
    while ((im = inlineRegex.exec(seg.text))) {
      html += escapeHtml(seg.text.slice(innerCursor, im.index));
      try {
        html += katex.renderToString(im[1], {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        html += escapeHtml(`$${im[1]}$`);
      }
      innerCursor = inlineRegex.lastIndex;
    }
    html += escapeHtml(seg.text.slice(innerCursor));
  }

  // preserve single line breaks within paragraph
  return html.replace(/\n/g, "<br />");
  void lastIndex;
}

export function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
