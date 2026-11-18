import type { Plugin, ViteDevServer } from "vite";
import { listPages } from "../paths";

/**
 * Pages live in src/pages but are served from the site root, so
 * src/pages/about.html is /about.html in development and dist/about.html in
 * the build. /about (no extension) works in development too, as it does on the
 * hosts.
 */
export function pagesAtRoot(): Plugin {
  const known = new Set(listPages().map((page) => `/${page}`));

  return {
    name: "nelview-pages-at-root",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && (req.method === "GET" || req.method === "HEAD")) {
          const [path, query = ""] = req.url.split("?");
          const page = path.endsWith("/")
            ? `${path}index.html`
            : path.endsWith(".html")
              ? path
              : `${path}.html`;
          if (known.has(page))
            req.url = `/pages${page}${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        // Files Vite itself emitted (bundled scripts and styles). Only links to
        // these need adjusting; hand-written links to public files are already
        // relative to the page's final address.
        const emitted = Object.keys(bundle).filter(
          (key) => !key.startsWith("pages/"),
        );
        for (const [key, file] of Object.entries(bundle)) {
          if (file.type !== "asset" || !key.startsWith("pages/")) continue;
          // The page moves one folder up, so links to emitted files lose one "../".
          let html = String(file.source);
          for (const target of emitted)
            html = html.replaceAll(`../${target}`, `./${target}`);
          file.fileName = key.slice("pages/".length);
          file.source = html;
          delete bundle[key];
          bundle[file.fileName] = file;
        }
      },
    },
  };
}
