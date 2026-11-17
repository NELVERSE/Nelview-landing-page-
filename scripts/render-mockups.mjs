// Renders the product mock-ups on the site into images.
//
//   pnpm run mockups
//
// Also writes scripts/mockup-sizes.json: the width and height attributes the <img> tags need.
//
// The source markup lives in src/pages/_mockups.html (never part of the site
// build). Each <div data-mock="name" data-kind="png|gif"> becomes
// public/assets/mockups/<name>.webp (still) or <name>.gif (bars filling in),
// in English and French (<name>-fr.*). Needs ImageMagick ("convert") for GIFs.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "assets", "mockups");
const SCALE = 2;
const FPS = 14;
const sizes = {};

mkdirSync(outDir, { recursive: true });
const server = await createServer({ configFile: join(root, "vite.config.ts"), server: { port: 5199, open: false }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();

try {
  for (const lang of ["en", "fr"]) {
    const context = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: SCALE });
    await context.addInitScript((l) => {
      try {
        localStorage.setItem("nv_consent", "1");
        localStorage.setItem("nv_lang", l);
      } catch {}
    }, lang);
    const page = await context.newPage();
    await page.goto("http://localhost:5199/_mockups", { waitUntil: "load" });
    await page.waitForTimeout(800);
    await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}.shot-src .mock{box-shadow:none!important;border-radius:0!important}.shot-src .nb-v{box-shadow:none!important;border-radius:0!important}" });
    const suffix = lang === "fr" ? "-fr" : "";

    for (const item of await page.locator("[data-mock]").all()) {
      const name = await item.getAttribute("data-mock");
      const kind = await item.getAttribute("data-kind");
      const target = item.locator("> *").first();
      const box = await target.boundingBox();
      sizes[name] = { w: Math.round(box.width), h: Math.round(box.height) };

      if (kind === "png") {
        const png = await target.screenshot({ type: "png" });
        await sharp(png).webp({ lossless: true, effort: 6 }).toFile(join(outDir, `${name}${suffix}.webp`));
        continue;
      }

      // Bars fill one after another, then the picture holds.
      const bars = await target.locator(".bar > span").count();
      await target.evaluate((el) => {
        el.querySelectorAll(".bar > span").forEach((bar, i) => {
          const final = bar.style.width;
          const anim = bar.animate([{ width: "0%" }, { width: final }], { duration: 900, delay: i * 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });
          anim.pause();
        });
      });
      const total = 900 + Math.max(0, bars - 1) * 120;
      const frames = Math.ceil((total / 1000) * FPS) + 1;
      const tmp = mkdtempSync(join(tmpdir(), "mockup-"));
      const files = [];
      for (let f = 0; f < frames; f++) {
        const t = Math.min(total, (f / FPS) * 1000);
        await target.evaluate((el, time) => el.querySelectorAll(".bar > span").forEach((bar) => bar.getAnimations().forEach((a) => (a.currentTime = time))), t);
        const file = join(tmp, `f${String(f).padStart(3, "0")}.png`);
        writeFileSync(file, await target.screenshot({ type: "png" }));
        files.push(file);
      }
      const args = ["-loop", "0"];
      files.forEach((file, i) => {
        const delay = i === 0 ? 45 : i === files.length - 1 ? 260 : Math.round(100 / FPS);
        args.push("-delay", String(delay), file);
      });
      // GIFs are big: 1.5x the page size, a small palette, only changed pixels per frame.
      args.push("-resize", "75%", "-colors", "64", "-dither", "None", "-fuzz", "3%", "-layers", "OptimizeFrame", "-layers", "OptimizeTransparency", join(outDir, `${name}${suffix}.gif`));
      execFileSync("convert", args);
      rmSync(tmp, { recursive: true, force: true });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

writeFileSync(join(root, "scripts", "mockup-sizes.json"), JSON.stringify(sizes, null, 2) + "\n");
console.log("Rendered", Object.keys(sizes).length, "mock-ups:", JSON.stringify(sizes));
