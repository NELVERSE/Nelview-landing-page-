import { defineConfig, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
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
