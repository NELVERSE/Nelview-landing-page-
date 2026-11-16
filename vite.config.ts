import {
  defineConfig,
  type HtmlTagDescriptor,
  type ViteDevServer,
} from "vite";
import react from "@vitejs/plugin-react";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { parse, resolve } from "node:path";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL(".", import.meta.url));

function responsiveWebp() {
  const images = new Map<string, number>();

  return {
    name: "nelview-responsive-webp",
    apply: "build" as const,
    async transformIndexHtml(html: string) {
      const tags = [
        ...html.matchAll(/<img\b[^>]*\bsrc=(["'])(assets\/[^"']+)\1[^>]*>/gi),
      ];
      let output = html;

      for (const match of tags.reverse()) {
        const image = match[0];
        const source = match[2];
        if (source.startsWith("assets/team/")) continue;
        const input = resolve(root, "public", source);
        if (!existsSync(input)) continue;

        const metadata = await sharp(input).metadata();
        if (!metadata.width || statSync(input).size < 200_000) continue;

        images.set(source, metadata.width);
        const { dir, name } = parse(source);
        const widths = [480, 960, 1440].filter(
          (width) => width < metadata.width!,
        );
        if (metadata.width <= 1440) widths.push(metadata.width);
        const srcset = widths
          .map((width) => `${resolveAssetPath(dir, name, width)} ${width}w`)
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
      const output = resolve(root, "dist", "assets");
      for (const [source, originalWidth] of images) {
        const input = resolve(root, "public", source);
        const { dir, name } = parse(source);
        const widths = [480, 960, 1440].filter(
          (width) => width < originalWidth,
        );
        if (originalWidth <= 1440) widths.push(originalWidth);

        for (const width of widths) {
          const destination = resolve(
            output,
            dir.replace(/^assets[\\/]/, ""),
            `${name}-${width}.webp`,
          );
          mkdirSync(resolve(destination, ".."), { recursive: true });
          await sharp(input)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78, effort: 4 })
            .toFile(destination);
        }
      }
    },
  };
}

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

function seoMeta() {
  // Never indexed, on any build: error page, referral redirect, embedded demo.
  const neverIndexed = new Set([
    "/404.html",
    "/beta.html",
    "/src/demo/index.html",
  ]);
  // One file serves many URLs (article.html?p=...), so no single canonical URL.
  const noCanonical = new Set(["/article.html"]);

  return {
    name: "nelview-seo-meta",
    apply: "build" as const,
    transformIndexHtml(html: string, ctx: { path: string }) {
      const tags: HtmlTagDescriptor[] = [];
      const meta = (attrs: Record<string, string>) =>
        tags.push({ tag: "meta", attrs, injectTo: "head" });

      if (isPreview || neverIndexed.has(ctx.path)) {
        if (!/<meta[^>]+name=["']robots["']/i.test(html))
          meta({ name: "robots", content: "noindex, nofollow" });
      }
      if (neverIndexed.has(ctx.path)) return tags;

      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim();
      const description = html
        .match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
        .match(/content="([^"]*)"/i)?.[1];
      const page = ctx.path.replace(/^\//, "").replace(/\.html$/, "");
      const url = `${SITE_URL}/${page === "index" ? "" : page}`;

      if (!noCanonical.has(ctx.path)) {
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
        resolve(root, "dist", "robots.txt"),
        "# Preview build: keep out of search engines.\nUser-agent: *\nDisallow: /\n",
      );
    },
  };
}

function resolveAssetPath(directory: string, name: string, width: number) {
  return `${directory}/${name}-${width}.webp`;
}

function demoFiles() {
  const source = resolve(root, "src", "demo");

  return {
    name: "nelview-demo-files",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/demo", (req, res, next) => {
        if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
          next();
          return;
        }

        const pathname = new URL(req.url, "http://localhost").pathname;
        if (pathname !== "/index.html") {
          next();
          return;
        }

        const html = readFileSync(resolve(source, "index.html"), "utf8");
        server
          .transformIndexHtml("/demo/index.html", html)
          .then((transformed) => {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(req.method === "HEAD" ? undefined : transformed);
          })
          .catch(next);
      });
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const sourcePath = "src/demo/index.html";
        const demoHtml = bundle[sourcePath];
        if (!demoHtml || demoHtml.type !== "asset") return;

        demoHtml.fileName = "demo/index.html";
        demoHtml.source = String(demoHtml.source).replaceAll(
          "../../assets/",
          "../assets/",
        );
        delete bundle[sourcePath];
        bundle[demoHtml.fileName] = demoHtml;
      },
    },
  };
}

// Every .html file in the project root is a page.
const pages = Object.fromEntries(
  readdirSync(root)
    .filter((f) => f.endsWith(".html"))
    .map((f) => [f.replace(/\.html$/, ""), resolve(root, f)]),
);

export default defineConfig({
  base: "./", // relative URLs: works on a custom domain, Vercel, Netlify or GitHub Pages sub-paths
  plugins: [
    react(),
    ViteImageOptimizer({
      includePublic: true,
      logStats: true,
      png: { quality: 80 },
      jpeg: { quality: 80 },
      jpg: { quality: 80 },
      webp: { quality: 80 },
    }),
    responsiveWebp(),
    seoMeta(),
    demoFiles(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ...pages,
        "demo/index": resolve(root, "src", "demo", "index.html"),
      },
    },
  },
  server: { open: "/index.html" },
});
