/**
 * Deterministic, client-side formatter that turns a "wall of text" coming
 * from Google Docs into structured Markdown. Used as a fallback when the
 * AI-based formatter / translator does not produce Markdown structure
 * (e.g. AI credits exhausted, plain-text response, etc.).
 *
 * Rules:
 *  - If the text already contains Markdown structure (#, **, lists, tables),
 *    it is returned as-is.
 *  - Otherwise the text is split into blocks (blank-line separated). Short
 *    blocks that look like titles are promoted to "## " / "### " headings.
 *  - Lines beginning with bullet markers (•, ·, –, —, -, *, "1.") are
 *    normalized to "- " markdown bullets.
 *  - Long blocks are wrapped as paragraphs with blank lines between them.
 */
export function formatReportLocal(input: string): string {
  const text = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  // If clearly markdown already, don't touch it.
  const hasMd =
    /(^|\n)#{1,6}\s/.test(text) ||
    /\*\*[^*\n]+\*\*/.test(text) ||
    /(^|\n)\s*[-*]\s+\S/.test(text) ||
    /(^|\n)\s*\d+\.\s+\S/.test(text) ||
    /\|.+\|/.test(text);
  if (hasMd) return text;

  // Split into blocks on 1+ blank lines OR on single line breaks when the
  // text comes as one giant paragraph.
  const rawBlocks = text.split(/\n\s*\n+/);
  const blocks: string[] = rawBlocks.length > 1 ? rawBlocks : splitMonolith(text);

  const out: string[] = [];
  for (const blockRaw of blocks) {
    const block = blockRaw.trim();
    if (!block) continue;

    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

    // Bullet list block: most lines start with a bullet marker.
    const bulletLines = lines.filter((l) => /^[•·–—\-*]\s+/.test(l) || /^\d+[.)]\s+/.test(l));
    if (bulletLines.length >= 2 && bulletLines.length >= lines.length - 1) {
      const items = lines.map((l) =>
        l.replace(/^[•·–—\-*]\s+/, "- ").replace(/^(\d+)[.)]\s+/, "$1. "),
      );
      out.push(items.join("\n"));
      continue;
    }

    // Single short line → heading.
    if (lines.length === 1) {
      const line = lines[0];
      if (isHeading(line)) {
        const level = line === line.toUpperCase() && line.length <= 80 ? 2 : 3;
        out.push(`${"#".repeat(level)} ${cleanHeading(line)}`);
        continue;
      }
    }

    // Otherwise treat as a paragraph (preserve internal line breaks as spaces).
    out.push(lines.join(" "));
  }

  return out.join("\n\n");
}

function isHeading(line: string): boolean {
  if (line.length > 90) return false;
  if (/[.!?:;,]$/.test(line)) return false;
  // ALL CAPS short line
  if (line === line.toUpperCase() && /[A-ZÀ-Ý]/.test(line)) return true;
  // Title Case-ish: starts with capital, ≤ 10 words, no trailing punctuation
  const words = line.split(/\s+/);
  if (words.length <= 10 && /^[A-ZÀ-Ý0-9]/.test(line)) return true;
  return false;
}

function cleanHeading(line: string): string {
  return line.replace(/^[#>\-*•·–—\s]+/, "").trim();
}

/**
 * Split a single very long block of text into smaller blocks by detecting
 * candidate heading sentences (short, capitalized, no terminal punctuation)
 * that appear inline.
 */
function splitMonolith(text: string): string[] {
  // Break on sentence boundaries first, then re-group.
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  let buf: string[] = [];
  for (const s of sentences) {
    const looksLikeHeading = s.length <= 70 && !/[.!?:;,]$/.test(s) && /^[A-ZÀ-Ý0-9]/.test(s);
    if (looksLikeHeading && buf.length) {
      blocks.push(buf.join(" "));
      buf = [s];
    } else {
      buf.push(s);
    }
  }
  if (buf.length) blocks.push(buf.join(" "));
  return blocks;
}
