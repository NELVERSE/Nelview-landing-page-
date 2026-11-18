import type { Plugin } from "vite";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { parse, resolve } from "node:path";
import sharp from "sharp";
import { outDir, publicDir } from "../paths";

/** Wraps large local images in <picture> with responsive WebP sources. */
export function responsiveWebp(): Plugin {
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
