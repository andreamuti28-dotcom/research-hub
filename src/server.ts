import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// A client that navigates away / cancels an in-flight request aborts the
// connection. srvx surfaces that as an AbortError and h3 turns it into a 500,
// but it is not an application error: never log it or render the error page.
function isClientAbort(error: unknown): boolean {
  if (!error) return false;
  const err = error as { name?: unknown; message?: unknown; cause?: unknown };
  if (err.name === "AbortError") return true;
  if (typeof err.message === "string" && /\baborted\b/i.test(err.message)) return true;
  return err.cause ? isClientAbort(err.cause) : false;
}

const clientAbortResponse = () => new Response(null, { status: 499 });

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const captured = consumeLastCapturedError();
  if (request.signal.aborted || isClientAbort(captured)) {
    return clientAbortResponse();
  }

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Inline hydration/theme bootstrap scripts require 'unsafe-inline'.
  // 'unsafe-eval' and the https: wildcard are removed: no third-party scripts.
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https: wss:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

function isHttps(request: Request): boolean {
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (new URL(request.url).protocol === "https:" ? "https" : "http");
  return proto.split(",")[0]?.trim() === "https";
}

// HSTS preload requires plain HTTP to 301 to HTTPS and to NOT send an HSTS
// header over HTTP.
function httpToHttpsRedirect(request: Request): Response | null {
  if (isHttps(request)) return null;
  const url = new URL(request.url);
  url.protocol = "https:";
  url.port = "";
  return new Response(null, {
    status: 301,
    headers: { location: url.toString() },
  });
}

function withSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") ?? "";
  const isDocument = contentType.includes("text/html");

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  if (isHttps(request)) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  } else {
    headers.delete("Strict-Transport-Security");
  }
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isDocument) headers.set("Content-Security-Policy", CSP);

  // Belt-and-braces: admin surfaces must never be indexed.
  if (new URL(request.url).pathname.startsWith("/admin")) {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    headers.set("Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const redirect = httpToHttpsRedirect(request);
      if (redirect) return redirect;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(
        await normalizeCatastrophicSsrResponse(response, request),
        request,
      );
    } catch (error) {
      if (isClientAbort(error) || request.signal.aborted) {
        return clientAbortResponse();
      }
      console.error(error);
      return withSecurityHeaders(brandedErrorResponse(), request);
    }
  },
};


