/**
 * Tag helpers: each paper tag maps to a CSS variable that drives the accent
 * line colour of its card. Values can be overridden from the admin area
 * (Contenuti & Tema) because theme overrides are injected as :root variables.
 */

export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tagTokenName(tag: string): string {
  return `--tag-${tagSlug(tag)}`;
}

/** Deterministic pleasant default colour for a tag with no override. */
const DEFAULT_PALETTE = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export function defaultTagColor(tag: string): string {
  let hash = 0;
  const slug = tagSlug(tag);
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_PALETTE[hash % DEFAULT_PALETTE.length];
}

/** CSS colour expression for a card accent line, based on its first tag. */
export function tagAccentColor(tags: string[]): string {
  const tag = tags?.[0];
  if (!tag) return "var(--card-accent, var(--primary))";
  return `var(${tagTokenName(tag)}, ${defaultTagColor(tag)})`;
}
