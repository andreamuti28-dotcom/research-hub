/**
 * Deterministic, client-side formatter that turns a "wall of text" (often
 * produced by a translation pipeline that strips newlines) into structured
 * Markdown. Heuristics:
 *  - insert a space when sentence punctuation runs into the next sentence
 *  - promote ALL-CAPS runs of 2+ words to `## headings`
 *  - promote short "Word(s):" labels (S&P 500:, Nasdaq:, Euro Stoxx 50 (FEZ):)
 *    to `### subheadings`
 *  - split into paragraphs at sentence boundaries
 */

// Common financial / market subheading prefixes — used to split a wall of
// text when the upstream pipeline strips whitespace between sections.
const TICKER_PREFIXES = [
  "S&P",
  "Nasdaq",
  "NASDAQ",
  "Dow",
  "Russell",
  "DAX",
  "FTSE",
  "CAC",
  "Nikkei",
  "Hang Seng",
  "Euro Stoxx",
  "Bitcoin",
  "Ethereum",
  "BTC",
  "ETH",
  "Oro",
  "Gold",
  "EUR/USD",
  "USD/JPY",
  "GBP/USD",
  "Brent",
  "WTI",
  "VIX",
];

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

  // 1) Insert a space after .!? when followed directly by an uppercase letter
  //    ("significativi.ANALISI" -> "significativi. ANALISI").
  text = text.replace(/([.!?])([A-ZÀ-Ý])/g, "$1 $2");

  // 2) Insert a paragraph break before known ticker / instrument labels that
  //    are stuck to the previous word.
  //    "MERCATIS&P 500:" -> "MERCATI\n\nS&P 500:"
  //    "forza.Nasdaq:"   -> "forza.\n\nNasdaq:"
  for (const prefix of TICKER_PREFIXES) {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the prefix only when it is followed (within a short distance) by ":".
    const re = new RegExp(
      `(\\S)\\s*(${escaped}(?:\\s[\\w&/().\\-]+){0,4}\\s*:)`,
      "g",
    );
    text = text.replace(re, (_m, prev: string, label: string) => {
      // Avoid breaking when prev is itself punctuation that already separates.
      const sep = /[\s\n]/.test(prev) ? prev : prev;
      return `${sep}\n\n### ${label.trim()}\n\n`;
    });
  }

  // 3) Promote ALL-CAPS runs (2+ pure-letter uppercase words, ≥3 letters each,
  //    with optional Italian/English connectors) to `## headings`.
  text = text.replace(
    /\b([A-ZÀ-Ý]{3,}(?:\s+(?:DI|DEI|DEL|DELLA|DELLE|DA|IN|SU|PER|AL|ALLA|E|ED|A|OF|THE|AND|OR|TO|FOR|ON|AT)\s+[A-ZÀ-Ý]{3,}|\s+[A-ZÀ-Ý]{3,})+)\b/g,
    (_m, heading: string) => `\n\n## ${heading.trim()}\n\n`,
  );

  // 4) Split long paragraphs at sentence boundaries — using split() so we
  //    never drop characters. A sentence boundary is .!? followed by a space
  //    and an uppercase letter (decimal numbers like "1.15" are preserved).
  text = text
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (!b || b.startsWith("#")) return b;
      const parts = b.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý"'(])/g);
      if (parts.length <= 2) return b;
      const groups: string[] = [];
      for (let i = 0; i < parts.length; i += 2) {
        groups.push(parts.slice(i, i + 2).join(" "));
      }
      return groups.join("\n\n");
    })
    .join("\n\n");

  // 5) Cleanup: collapse extra whitespace and blank lines.
  text = text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}
