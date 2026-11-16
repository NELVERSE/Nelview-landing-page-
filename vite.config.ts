import {
  defineConfig,
  type HtmlTagDescriptor,
  type Plugin,
  type ViteDevServer,
} from "vite";
import react from "@vitejs/plugin-react";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, parse, relative, resolve } from "node:path";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Layout: src/ is the Vite root, src/pages/ holds the HTML pages, public/ holds
// files copied as they are, dist/ is the build output.
const repo = fileURLToPath(new URL(".", import.meta.url));
const src = resolve(repo, "src");
const pagesDir = resolve(src, "pages");
const publicDir = resolve(repo, "public");
const outDir = resolve(repo, "dist");

// Public address of the production site, used for canonical and share-card URLs.
const SITE_URL = (process.env.SITE_URL || "https://www.nelview.com").replace(
  /\/+$/,
  "",
);

// A preview build is anything that is not the production site: the `preview`
// branch and pull requests in GitHub Actions (NELVIEW_ENV), Vercel preview
// deployments, and Netlify deploy previews / branch deploys. Local builds and
// `main` are production. Preview builds are hidden from search engines.
const isPreview =
  process.env.NELVIEW_ENV !== "production" &&
  (process.env.NELVIEW_ENV === "preview" ||
    process.env.VERCEL_ENV === "preview" ||
    (process.env.NETLIFY === "true" && process.env.CONTEXT !== "production"));

/** Every .html file under src/pages, as paths relative to it ("about.html", "demo/index.html"). */
function listPages(dir = pagesDir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listPages(full);
    return entry.name.endsWith(".html")
      ? [relative(pagesDir, full).replace(/\\/g, "/")]
      : [];
  });
}

/** The site path a page is served at: "/pages/about.html" -> "/about.html". */
const sitePath = (htmlPath: string) => htmlPath.replace(/^\/pages\//, "/");

/**
 * Pages live in src/pages but are served from the site root, so
 * src/pages/about.html is /about.html in development and dist/about.html in
 * the build. /about (no extension) works in development too, as it does on the
 * hosts.
 */
function pagesAtRoot(): Plugin {
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
        for (const [key, file] of Object.entries(bundle)) {
          if (file.type !== "asset" || !key.startsWith("pages/")) continue;
          // One folder shallower, so built-asset URLs lose one "../".
          file.fileName = key.slice("pages/".length);
          file.source = String(file.source).replace(
            /(["'(\s,])\.\.\/((?:\.\.\/)*assets\/)/g,
            "$1./$2",
          );
          delete bundle[key];
          bundle[file.fileName] = file;
        }
      },
    },
  };
}

/** Canonical and share-card tags on every page; noindex on previews. */
function seoMeta(): Plugin {
  // Never indexed, on any build: error page, referral redirect, embedded demo.
  const neverIndexed = new Set(["/404.html", "/beta.html", "/demo/index.html"]);
  // One file serves many URLs (article.html?p=...), so it sets its own canonical.
  const noCanonical = new Set(["/article.html"]);

  return {
    name: "nelview-seo-meta",
    apply: "build",
    transformIndexHtml(html, ctx) {
      const path = sitePath(ctx.path);
      const tags: HtmlTagDescriptor[] = [];
      const meta = (attrs: Record<string, string>) =>
        tags.push({ tag: "meta", attrs, injectTo: "head" });

      if (isPreview || neverIndexed.has(path)) {
        if (!/<meta[^>]+name=["']robots["']/i.test(html))
          meta({ name: "robots", content: "noindex, nofollow" });
      }
      if (neverIndexed.has(path)) return tags;

      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim();
      const description = html
        .match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
        .match(/content="([^"]*)"/i)?.[1];
      const page = path.replace(/^\//, "").replace(/\.html$/, "");
      const url = `${SITE_URL}/${page === "index" ? "" : page}`;

      if (!noCanonical.has(path)) {
        tags.push({
          tag: "link",
          attrs: { rel: "canonical", href: url },
          injectTo: "head",
        });
        meta({ property: "og:url", content: url });
      }
      meta({ property: "og:type", content: "website" });
      meta({ property: "og:site_name", content: "Nelview" });
      if (title) meta({ property: "og:title", content: title });
      if (description)
        meta({ property: "og:description", content: description });
      meta({ property: "og:image", content: `${SITE_URL}/og-image.png` });
      meta({ name: "twitter:card", content: "summary_large_image" });
      return tags;
    },
    closeBundle() {
      if (!isPreview) return;
      writeFileSync(
        resolve(outDir, "robots.txt"),
        "# Preview build: keep out of search engines.\nUser-agent: *\nDisallow: /\n",
      );
    },
  };
}

/** Wraps large local images in <picture> with responsive WebP sources. */
function responsiveWebp(): Plugin {
  const images = new Map<string, number>();
  const widthsFor = (original: number) => {
    const widths = [480, 960, 1440].filter((width) => width < original);
    if (original <= 1440) widths.push(original);
    return widths;
  };

  return {
    name: "nelview-responsive-webp",
    apply: "build",
    async transformIndexHtml(html) {
      const tags = [
        ...html.matchAll(/<img\b[^>]*\bsrc=(["'])(assets\/[^"']+)\1[^>]*>/gi),
      ];
      let output = html;

      for (const match of tags.reverse()) {
        const image = match[0];
        const source = match[2];
        if (source.startsWith("assets/team/")) continue;
        const input = resolve(publicDir, source);
        if (!existsSync(input)) continue;

        const metadata = await sharp(input).metadata();
        if (!metadata.width || statSync(input).size < 200_000) continue;

        images.set(source, metadata.width);
        const { dir, name } = parse(source);
        const srcset = widthsFor(metadata.width)
          .map((width) => `${dir}/${name}-${width}.webp ${width}w`)
          .join(", ");
        const picture = `<picture><source type="image/webp" srcset="${srcset}" sizes="(max-width: 720px) 100vw, 50vw">${image}</picture>`;

        output =
          output.slice(0, match.index) +
          picture +
          output.slice(match.index! + image.length);
      }

      return output;
    },
    async closeBundle() {
      for (const [source, originalWidth] of images) {
        const { dir, name } = parse(source);
        for (const width of widthsFor(originalWidth)) {
          const destination = resolve(outDir, dir, `${name}-${width}.webp`);
          mkdirSync(resolve(destination, ".."), { recursive: true });
          await sharp(resolve(publicDir, source))
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78, effort: 4 })
            .toFile(destination);
        }
      }
    },
  };
}

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
      input: Object.fromEntries(
        listPages().map((page) => [
          page.replace(/\.html$/, ""),
          resolve(pagesDir, page),
        ]),
      ),
    },
  },
  server: { open: "/" },
});
