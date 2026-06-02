import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { themeBootstrapScript } from "@/hooks/use-theme";
import { langBootstrapScript } from "@/hooks/use-language";
import { CookieConsent } from "@/components/CookieConsent";


import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Andrea Muti — Finance" },
      {
        name: "description",
        content:
          "Archivio di paper e saggi di ricerca indipendente sull'intersezione tra etica digitale, infrastrutture e cognizione.",
      },
      { name: "author", content: "Andrea Muti" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "theme-color", content: "#ffffff" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Andrea Muti" },
      { property: "og:locale", content: "it_IT" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@andreamuti" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", sizes: "16x16 32x32 48x48", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "mask-icon", color: "#3b5bdb", href: "/maskable-icon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Andrea Muti",
          url: "https://www.andreamuti.com/",
          inLanguage: "it",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Andrea Muti",
          url: "https://www.andreamuti.com/",
          jobTitle: "Ricercatore indipendente",
          description:
            "Ricercatore indipendente in finanza quantitativa, mercati e investimenti.",
          sameAs: ["https://www.linkedin.com"],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <script dangerouslySetInnerHTML={{ __html: langBootstrapScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeOverridesStyle />
      <Outlet />
      <CookieConsent />
    </QueryClientProvider>
  );
}

function ThemeOverridesStyle() {
  const { themeOverrides } = useSiteSettings();
  const entries = Object.entries(themeOverrides ?? {});
  if (entries.length === 0) return null;
  const css = `:root{${entries
    .map(([k, v]) => `${k}:${String(v).replace(/[;}{]/g, "")};`)
    .join("")}}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
