import { readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Layout: src/ is the Vite root, src/pages/ holds the HTML pages, public/ holds
// files copied as they are, dist/ is the build output.
export const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const src = resolve(repo, "src");
export const pagesDir = resolve(src, "pages");
export const publicDir = resolve(repo, "public");
export const outDir = resolve(repo, "dist");

// Public address of the production site, used for canonical and share-card URLs.
export const SITE_URL = (process.env.SITE_URL || "https://www.nelview.com").replace(
  /\/+$/,
  "",
);

// A preview build is anything that is not the production site: the `preview`
// branch and pull requests in GitHub Actions (NELVIEW_ENV), Vercel preview
// deployments, and Netlify deploy previews / branch deploys. Local builds and
// `main` are production. Preview builds are hidden from search engines.
export const isPreview =
  process.env.NELVIEW_ENV !== "production" &&
  (process.env.NELVIEW_ENV === "preview" ||
    process.env.VERCEL_ENV === "preview" ||
    (process.env.NETLIFY === "true" && process.env.CONTEXT !== "production"));

/** Every .html file under src/pages, as paths relative to it ("about.html", "demo/index.html"). */
export function listPages(dir = pagesDir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listPages(full);
    return entry.name.endsWith(".html")
      ? [relative(pagesDir, full).replace(/\\/g, "/")]
      : [];
  });
}

/** Pages that are built and served: files starting with "_" are development-only. */
export const builtPages = () =>
  listPages().filter((page) => !/(^|\/)_/.test(page));

/** The site path a page is served at: "/pages/about.html" -> "/about.html". */
export const sitePath = (htmlPath: string) => htmlPath.replace(/^\/pages\//, "/");
