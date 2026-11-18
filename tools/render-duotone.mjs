// Bakes the coloured photo treatment into the image files.
//
//   pnpm run duotone
//
// The home page's photo cards used CSS (grayscale + mix-blend-mode: multiply)
// to wash each photo in one colour. Blend modes and filters on large photos make
// phones re-paint every frame and can freeze or crash mobile Safari, so the
// same result (a grey photo multiplied by the colour) is made here, once.
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const photos = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "assets", "photos");

// [source, output, colour] — colours are the --c-coral, --c-blue and --c-amber tokens.
const washes = [
  ["microscope-w.jpg", "duo-microscope-coral.webp", "#df4f3a"],
  ["pipette-blue.jpg", "duo-pipette-blue.webp", "#2f6fed"],
  ["lab-notes.jpg", "duo-lab-notes-amber.webp", "#c97a04"],
];

for (const [src, out, colour] of washes) {
  const grey = await sharp(join(photos, src)).resize({ width: 900 }).grayscale().toBuffer();
  const { width, height } = await sharp(grey).metadata();
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
  const info = await sharp({ create: { width, height, channels: 3, background: { r, g, b } } })
    .composite([{ input: grey, blend: "multiply" }])
    .webp({ quality: 80, effort: 6 })
    .toFile(join(photos, out));
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}

// The experts hero photo was dimmed with filter: grayscale(0.35).
const muted = await sharp(join(photos, "reviewing.png"))
  .modulate({ saturation: 0.65 })
  .webp({ quality: 80, effort: 6 })
  .toFile(join(photos, "reviewing-muted.webp"));
console.log("reviewing-muted.webp", `${muted.width}x${muted.height}`, `${Math.round(muted.size / 1024)} KB`);
