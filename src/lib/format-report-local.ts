/**
 * Deterministic, client-side formatter that turns a "wall of text" coming
 * from Google Docs (often with missing whitespace between sentences and
 * sections) into structured Markdown. Used as a fallback when the AI-based
 * formatter / translator does not produce Markdown structure.
 */
export function formatReportLocal(input: string): string {
  let text = (input ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  // If clearly markdown already, leave it alone.
  const hasMd =
    /(^|\n)#{1,6}\s/.test(text) ||
    /\*\*[^*\n]+\*\*/.test(text) ||
    /(^|\n)\s*[-*]\s+\S/.test(text) ||
    /(^|\n)\s*\d+\.\s+\S/.test(text) ||
    /\|.+\|/.test(text);
  if (hasMd) return text;

  // ---- Whitespace normalization ----------------------------------------
  // Insert a space after .!?:; when directly followed by an uppercase letter
  // ("significativi.ANALISI" -> "significativi. ANALISI").
  text = text.replace(/([.!?:;])([A-ZÀ-ÝÈÉÌÒÙ])/g, "$1 $2");
  // Insert a space between a lowercase/digit and an immediately-following
  // ALL-CAPS run of >=2 chars ("forzaNASDAQ" -> "forza NASDAQ").
  text = text.replace(/([a-zà-ÿ0-9])([A-ZÀ-Ý]{2,})/g, "$1 $2");

  // ---- Detect inline ALL-CAPS section headings -------------------------
  // e.g. "ANALISI TECNICA DEI MERCATI", "MACRO E POLITICA MONETARIA".
  // Headings end as soon as a non-uppercase letter / digit token appears.
  // We require >=2 consecutive uppercase words (>=3 letters each, articles
  // like "DI/DEI/E" allowed in between).
  text = text.replace(
    /(?:^|(?<=[\s.]))((?:[A-ZÀ-Ý][A-ZÀ-Ý&/'.\-]{2,}(?:\s+(?:[A-ZÀ-Ý][A-ZÀ-Ý&/'.\-]{1,}|DI|DEI|DEL|DELLA|DELLE|E|ED|DA|IN|SU|PER|AL|ALLA|A|IL|LA|LO|GLI|LE|UN|UNA|OF|THE|AND|OR|TO|FOR|IN|ON|OF|AT)){1,8}))/g,
    (match, heading: string) => `\n\n## ${heading.trim()}\n\n`,
  );

  // ---- Detect inline "Term:" subheadings (S&P 500:, Nasdaq:, Euro Stoxx 50 (FEZ):) ----
  // A subheading is a short capitalized phrase ending in ":" that introduces
  // a new sub-topic. Split before it when it appears mid-paragraph.
  text = text.replace(
    /(\S)\s+((?:[A-ZÀ-Ý][\w&/.'-]*(?:\s+[\w&/.'()-]+){0,5}):)\s+/g,
    (match, prev: string, heading: string) => {
      // Skip when the "heading" is actually a sentence continuation
      // (long phrases with internal lowercase wording stay as paragraph).
      if (heading.length > 60) return match;
      return `${prev}\n\n### ${heading}\n\n`;
    },
  );

  // ---- Final cleanup ---------------------------------------------------
  // Collapse 3+ blank lines, trim each line, remove leading/trailing blanks.
  text = text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Promote remaining standalone short lines to ### headings if they look
  // like titles (capitalized, no trailing punctuation, <=8 words).
  const blocks = text.split(/\n{2,}/);
  const out = blocks.map((b) => {
    const trimmed = b.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) return trimmed;
    const lines = trimmed.split("\n");
    if (lines.length === 1) {
      const line = lines[0];
      const words = line.split(/\s+/);
      if (
        words.length <= 8 &&
        line.length <= 80 &&
        /^[A-ZÀ-Ý0-9]/.test(line) &&
        !/[.!?,;]$/.test(line)
      ) {
        return `### ${line}`;
      }
    }
    return trimmed;
  });

  return out.filter(Boolean).join("\n\n");
}
