// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app may break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Configure Nitro's generated Wrangler config, not the removed top-level cloudflare option.
  // Workers Builds uses wrangler preview for branch previews and requires this block.
  nitro: {
    cloudflare: {
      // @ts-expect-error The installed plugin typings omit Nitro’s supported generated Wrangler preview config.
      wrangler: {
        previews: {},
      },
    },
  },
});
