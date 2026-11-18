import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { resolve } from "node:path";
import { builtPages, outDir, pagesDir, publicDir, src } from "./build/paths";
import { pagesAtRoot } from "./build/plugins/pages-at-root";
import { responsiveWebp } from "./build/plugins/responsive-webp";
import { seoMeta } from "./build/plugins/seo-meta";

// The build is described in build/: paths and environment (paths.ts) and the
// three plugins (plugins/). This file only wires them together.
export default defineConfig({
  root: src,
  publicDir,
  base: "./", // relative URLs: works on a custom domain, Vercel, Netlify or GitHub Pages sub-paths
  plugins: [
    react(),
    ViteImageOptimizer({
      includePublic: true,
      logStats: false,
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
    }),
    responsiveWebp(),
    seoMeta(),
    pagesAtRoot(),
  ],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      // Every page in src/pages (files starting with "_" are development-only).
      input: Object.fromEntries(
        builtPages().map((page) => [
          page.replace(/\.html$/, ""),
          resolve(pagesDir, page),
        ]),
      ),
    },
  },
  server: { open: "/" },
});
