// Google's Markdown export escapes characters the document typed literally
// (\# \* \- \| …). The market report is written as Markdown on purpose, so undo it.
export function unescapeMarkdown(text: string): string {
  return text.replace(/\\([\\`*_{}[\]()#+\-.!|>~&<])/g, "$1");
}
