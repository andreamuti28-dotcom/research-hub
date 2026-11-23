// Formatted layouts live in the translation cache under their own target, keyed
// by the hash of the raw report text: each report is formatted once, ever.
export const LAYOUT_CACHE_TARGET = "it-layout";

export const SYSTEM_PROMPT =
  "You receive an Italian financial report stored as plain text from Google Docs. " +
  "Reformat it into clean Markdown: detect section titles and turn them into '## ' or '### ' headings, " +
  "convert bullet-like lines into '- ' lists, group paragraphs with blank lines. Never add bold or italic. " +
  "and preserve any tables. " +
  "STRICT RULES: do NOT translate, do NOT add, remove, summarize or rewrite any word; keep the Italian wording exactly as-is, " +
  "including punctuation, numbers, currencies and proper nouns. Only add/normalize markdown structure (headings, lists, blank lines). " +
  'Return ONLY a JSON object: {"text":"..."} with the reformatted markdown.';
