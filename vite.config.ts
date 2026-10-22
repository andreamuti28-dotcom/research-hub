// Build configuration for TanStack Start on Cloudflare Workers.
// `vite build` produces dist/client (static assets) and dist/server (the Worker),
// plus the generated wrangler config that `wrangler deploy` picks up.
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // src/server.ts wraps the TanStack handler with security headers,
      // the apex -> www redirect and the branded error page.
      server: { entry: "server" },
      // Server-only modules must never end up in the browser bundle.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    viteReact(),
  ],
});
