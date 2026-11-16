import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures";

// The site lets long words break anywhere so nothing overflows. That hides
// layouts where a word does not fit its box: it gets split mid-word instead.
// This turns that rule off and reports every text element whose longest word
// then overflows, so such layouts are caught rather than silently split.
const dist = fileURLToPath(new URL("../../dist", import.meta.url));
const pages = readdirSync(dist)
  .filter((file) => file.endsWith(".html") && file !== "beta.html" && file !== "404.html")
  .map((file) => file.replace(/\.html$/, ""));

for (const width of [320, 360, 390]) {
  test.describe(`${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const name of pages) {
      test(`${name}: no word is split mid-word`, async ({ page }) => {
        await page.goto(name === "index" ? "/" : `/${name}`);
        await page.evaluate(() => (window as any).nvRevealAll?.());
        await page.addStyleTag({
          content: "*{overflow-wrap:normal!important;word-break:normal!important}",
        });
        const split = await page.evaluate(() => {
          const found: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>("main *, footer *")) {
            if (el.children.length) continue;
            const text = (el.textContent || "").trim();
            if (text.length < 3) continue;
            if (el.closest("svg, script, style, input, textarea, select, .mock, .app, [data-ring], video, code, pre")) continue;
            if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1)
              found.push(`${el.tagName.toLowerCase()}.${el.className} "${text.slice(0, 30)}" (${el.scrollWidth} > ${el.clientWidth})`);
          }
          return found;
        });
        expect(split, "text that would be split mid-word").toEqual([]);
      });
    }
  });
}
