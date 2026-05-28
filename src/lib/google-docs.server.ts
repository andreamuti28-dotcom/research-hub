// Server-only helper: fetch a Google Doc through the Lovable connector gateway
// and convert its JSON body into Markdown that the existing ReactMarkdown
// renderer can display with the same styling as archived reports.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_docs/v1";

type GDocTextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  link?: { url?: string };
};

type GDocTextRun = { content?: string; textStyle?: GDocTextStyle };

type GDocParagraphElement = {
  textRun?: GDocTextRun;
  inlineObjectElement?: { inlineObjectId?: string };
};

type GDocParagraph = {
  elements?: GDocParagraphElement[];
  paragraphStyle?: {
    namedStyleType?: string;
    alignment?: string;
  };
  bullet?: { nestingLevel?: number; listId?: string };
};

type GDocTableCell = { content?: GDocStructuralElement[] };
type GDocTableRow = { tableCells?: GDocTableCell[] };
type GDocTable = { tableRows?: GDocTableRow[] };

type GDocStructuralElement = {
  paragraph?: GDocParagraph;
  table?: GDocTable;
  sectionBreak?: unknown;
};

type GDoc = {
  title?: string;
  documentId?: string;
  body?: { content?: GDocStructuralElement[] };
};

function escapeMd(s: string): string {
  // Light escape — avoid breaking markdown but keep the prose intact.
  return s.replace(/([\\`*_{}\[\]])/g, "\\$1");
}

function renderTextRun(run: GDocTextRun): string {
  let text = run.content ?? "";
  if (!text) return "";
  // Strip a single trailing newline; paragraph breaks are inserted by the
  // paragraph walker, not by the text run itself.
  const hadTrailingNewline = text.endsWith("\n");
  if (hadTrailingNewline) text = text.slice(0, -1);
  if (!text) return hadTrailingNewline ? "" : "";

  const style = run.textStyle ?? {};
  const leading = text.match(/^\s*/)?.[0] ?? "";
  const trailing = text.match(/\s*$/)?.[0] ?? "";
  const core = text.slice(leading.length, text.length - trailing.length);

  if (!core) return text;

  let out = escapeMd(core);
  if (style.bold) out = `**${out}**`;
  if (style.italic) out = `*${out}*`;
  if (style.strikethrough) out = `~~${out}~~`;
  if (style.link?.url) out = `[${out}](${style.link.url})`;

  return `${leading}${out}${trailing}`;
}

function renderParagraphInline(elements: GDocParagraphElement[]): string {
  let out = "";
  for (const el of elements) {
    if (el.textRun) out += renderTextRun(el.textRun);
    // inline images intentionally omitted (Docs returns transient URIs)
  }
  return out;
}

function renderParagraph(p: GDocParagraph): string {
  const inline = renderParagraphInline(p.elements ?? []).trim();
  if (!inline) return "";

  const style = p.paragraphStyle?.namedStyleType ?? "NORMAL_TEXT";
  const bullet = p.bullet;

  if (bullet) {
    const indent = "  ".repeat(Math.max(0, bullet.nestingLevel ?? 0));
    return `${indent}- ${inline}`;
  }

  switch (style) {
    case "TITLE":
      return `# ${inline}`;
    case "SUBTITLE":
      return `## ${inline}`;
    case "HEADING_1":
      return `## ${inline}`;
    case "HEADING_2":
      return `### ${inline}`;
    case "HEADING_3":
      return `#### ${inline}`;
    case "HEADING_4":
    case "HEADING_5":
    case "HEADING_6":
      return `##### ${inline}`;
    default:
      return inline;
  }
}

function renderTable(t: GDocTable): string {
  const rows = t.tableRows ?? [];
  if (rows.length === 0) return "";
  const cellText = (cell: GDocTableCell): string => {
    const parts: string[] = [];
    for (const el of cell.content ?? []) {
      if (el.paragraph) {
        const txt = renderParagraphInline(el.paragraph.elements ?? []).trim();
        if (txt) parts.push(txt);
      }
    }
    return parts.join(" ").replace(/\|/g, "\\|");
  };
  const lines: string[] = [];
  rows.forEach((row, idx) => {
    const cells = (row.tableCells ?? []).map(cellText);
    lines.push(`| ${cells.join(" | ")} |`);
    if (idx === 0) {
      lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
    }
  });
  return lines.join("\n");
}

export function googleDocToMarkdown(doc: GDoc): string {
  const blocks: string[] = [];
  for (const el of doc.body?.content ?? []) {
    if (el.paragraph) {
      const rendered = renderParagraph(el.paragraph);
      if (rendered) blocks.push(rendered);
    } else if (el.table) {
      const rendered = renderTable(el.table);
      if (rendered) blocks.push(rendered);
    }
  }
  // Merge consecutive bullet lines into the same block (no blank line between
  // items), separate everything else by a blank line.
  const out: string[] = [];
  let prevWasBullet = false;
  for (const b of blocks) {
    const isBullet = /^\s*- /.test(b);
    if (out.length === 0) {
      out.push(b);
    } else if (isBullet && prevWasBullet) {
      out[out.length - 1] += `\n${b}`;
    } else {
      out.push(b);
    }
    prevWasBullet = isBullet;
  }
  return out.join("\n\n").trim();
}

export type FetchedGoogleDoc = {
  documentId: string;
  title: string;
  markdown: string;
};

export async function fetchGoogleDocAsMarkdown(documentId: string): Promise<FetchedGoogleDoc> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY non configurato");
  const GOOGLE_DOCS_API_KEY = process.env.GOOGLE_DOCS_API_KEY;
  if (!GOOGLE_DOCS_API_KEY) throw new Error("GOOGLE_DOCS_API_KEY non configurato (collega Google Docs)");

  const cleanId = documentId.trim();
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(cleanId)) {
    throw new Error("ID Google Doc non valido");
  }

  const res = await fetch(`${GATEWAY_URL}/documents/${cleanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_DOCS_API_KEY,
      Accept: "application/json",
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Google Docs API ${res.status}: ${body.slice(0, 500)}`);
  }
  const doc = JSON.parse(body) as GDoc;
  const markdown = googleDocToMarkdown(doc);
  return {
    documentId: doc.documentId ?? cleanId,
    title: (doc.title ?? "Report mercati").trim() || "Report mercati",
    markdown,
  };
}
