// Server-only helper: read the daily market report from a Google Doc.
//
// The document must be shared as "Anyone with the link can view": the site
// then downloads it through Google's public export endpoint, with no OAuth
// app, connector or API key to maintain. The report is published on the site
// anyway, so link sharing does not expose anything new.

const EXPORT_BASE = "https://docs.google.com/document/d";

export type FetchedGoogleDoc = {
  documentId: string;
  title: string;
  text: string;
};

/** Accepts a bare document id or a full Google Docs URL. */
export function extractDocumentId(input: string): string {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/\/document\/d\/([a-zA-Z0-9_-]{20,})/);
  return fromUrl ? fromUrl[1] : trimmed;
}

/** Document title from `Content-Disposition: attachment; filename="..."`. */
function titleFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  const plain = header.match(/filename="([^"]+)"/i);
  let name: string | null = null;
  try {
    name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : null;
  } catch {
    name = plain ? plain[1] : null;
  }
  return name ? name.replace(/\.(md|txt)$/i, "").trim() || null : null;
}

async function exportDoc(id: string, format: "md" | "txt"): Promise<Response> {
  return fetch(`${EXPORT_BASE}/${id}/export?format=${format}`, {
    redirect: "follow",
    headers: { Accept: "text/plain, text/markdown, */*" },
  });
}

function normalize(text: string): string {
  return text
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchGoogleDocAsText(documentId: string): Promise<FetchedGoogleDoc> {
  const cleanId = extractDocumentId(documentId);
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(cleanId)) {
    throw new Error("ID Google Doc non valido");
  }

  // Markdown keeps headings, lists and tables; plain text is the fallback.
  let res = await exportDoc(cleanId, "md");
  if (!res.ok && res.status !== 401 && res.status !== 403 && res.status !== 404) {
    res = await exportDoc(cleanId, "txt");
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Il Google Doc non è accessibile: condividilo con \"Chiunque abbia il link\" in sola lettura.",
    );
  }
  if (res.status === 404) throw new Error("Google Doc non trovato: controlla l'ID.");
  if (!res.ok) throw new Error(`Esportazione Google Doc fallita (HTTP ${res.status}).`);

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();
  // A private document can also answer 200 with Google's sign-in page.
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(body)) {
    throw new Error(
      "Il Google Doc non è accessibile: condividilo con \"Chiunque abbia il link\" in sola lettura.",
    );
  }

  return {
    documentId: cleanId,
    title: titleFromDisposition(res.headers.get("content-disposition")) ?? "Report giornaliero",
    text: normalize(body),
  };
}
