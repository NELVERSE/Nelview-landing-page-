import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures";

// The site has one type scale, one radius scale, one set of button roles and
// one title format. These check that every page keeps to them.
test.use({ viewport: { width: 1440, height: 900 } });

const MARKETING = ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/contact", "/journal-guide", "/resources"];
const UTILITY = ["/apply", "/waitlist", "/signin"];
const ALL = [...MARKETING, ...UTILITY, "/privacy", "/terms", "/article?p=desk-rejection"];

test("marketing pages share one title size and weight", async ({ page }) => {
  const seen = new Set<string>();
  for (const path of MARKETING) {
    await page.goto(path);
    const style = await page.locator("main h1").first().evaluate((el) => {
      const css = getComputedStyle(el);
      return `${css.fontSize}/${css.fontWeight}`;
    });
    seen.add(style);
  }
  expect([...seen], "differing page title styles").toHaveLength(1);
});

test("form, article and legal pages share one smaller title size", async ({ page }) => {
  const seen = new Set<string>();
  for (const path of [...UTILITY, "/privacy", "/terms", "/article?p=desk-rejection"]) {
    await page.goto(path);
    seen.add(
      await page.locator("main h1").first().evaluate((el) => {
        const css = getComputedStyle(el);
        return `${css.fontSize}/${css.fontWeight}`;
      }),
    );
  }
  expect([...seen], "differing utility title styles").toHaveLength(1);
});

test("section headings and closing statements share one size", async ({ page }) => {
  const sizes = new Set<string>();
  for (const path of ["/", "/pricing", "/institutions", "/experts", "/pledge", "/journal-guide", "/resources"]) {
    await page.goto(path);
    const found = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main .sec > .wrap > .h2, main .cta h2, main .cta-band h2, main .nlb h2, main .imgband h2")]
        .filter((el) => el.offsetParent)
        .map((el) => getComputedStyle(el).fontSize),
    );
    for (const size of found) sizes.add(size);
  }
  expect([...sizes], "differing section heading sizes").toHaveLength(1);
});

test("cards and panels use only the 10, 12 and 20px corner radii", async ({ page }) => {
  const odd: string[] = [];
  for (const path of ALL) {
    await page.goto(path);
    odd.push(
      ...(await page.evaluate(() => {
        const found: string[] = [];
        const selector = ".card, .feat, .step, .nt-c, .nb-c, .pc-c, .qc-c, .vs-f, .vs-p, .jg-ex, .role, .tldr, .fcard, .nlb, .cta, .imgband, .calc-out, .si-box";
        for (const el of document.querySelectorAll<HTMLElement>(`main ${selector}`)) {
          if (!el.offsetParent) continue;
          const radius = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius));
          if (![10, 12, 20].includes(radius)) found.push(`${el.className.toString().split(" ")[0]} ${radius}px`);
        }
        return found;
      })),
    );
  }
  expect([...new Set(odd)], "off-scale corner radii").toEqual([]);
});

test("primary buttons are dark, green only on dark panels and product screens", async ({ page }) => {
  const odd: string[] = [];
  for (const path of ALL) {
    await page.goto(path);
    odd.push(
      ...(await page.evaluate(() => {
        const found: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("main .btn-p, main .btn-d")) {
          if (!el.offsetParent || el.closest(".dark, .mock, .ex-hero, .pp-hl, .hs")) continue;
          const [r, g, b] = getComputedStyle(el).backgroundColor.match(/\d+/g)!.map(Number);
          const dark = r < 40 && g < 40 && b < 40;
          if (!dark) found.push(`${el.textContent!.trim()} (${r},${g},${b})`);
        }
        return found;
      })),
    );
  }
  expect(odd, "primary buttons that are not dark").toEqual([]);
});

test("every page title reads 'Name · Nelview'", async () => {
  const dist = fileURLToPath(new URL("../../dist", import.meta.url));
  const pages = readdirSync(dist).filter((f) => f.endsWith(".html") && !["index.html", "404.html", "beta.html"].includes(f));
  expect(pages.length).toBeGreaterThan(10);
  const { readFileSync } = await import("node:fs");
  for (const file of pages) {
    const html = readFileSync(`${dist}/${file}`, "utf8");
    const title = html.match(/<title>([^<]*)<\/title>/)![1].replace(/&amp;/g, "&");
    expect(title, file).toMatch(/^.+ · Nelview$/);
  }
});

test("section headings end with a full stop or a question mark", async ({ page }) => {
  const missing: string[] = [];
  for (const path of ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/contact", "/journal-guide", "/apply", "/signin"]) {
    await page.goto(path);
    missing.push(
      ...(await page.evaluate((route) =>
        [...document.querySelectorAll<HTMLElement>("main h1, main h2")]
          .filter((el) => el.offsetParent && !el.closest(".fcard, .fpanel, form, .mock, .app"))
          .map((el) => el.innerText.replace(/\s+/g, " ").trim())
          .filter((text) => !/[.?]$/.test(text))
          .map((text) => `${route}: ${text}`),
      path)),
    );
  }
  expect(missing, "headings without end punctuation").toEqual([]);
});

test("page headings are left-aligned on every page, About included", async ({ page }) => {
  for (const path of ["/pledge", "/about", "/pricing", "/institutions", "/experts", "/contact"]) {
    await page.goto(path);
    const aligned = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("main h1, main h2")]
        .filter((el) => el.offsetParent && !el.closest(".cta, .nlb, .closing"))
        .map((el) => getComputedStyle(el).textAlign),
    );
    expect(aligned.length, path).toBeGreaterThan(1);
    expect(aligned.every((a) => a === "start" || a === "left"), `${path}: ${aligned}`).toBe(true);
  }
});

test("headings have no italic accent", async ({ page }) => {
  const italic: string[] = [];
  for (const path of ALL) {
    await page.goto(path);
    italic.push(
      ...(await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("main h1 *, main h2 *, main h3 *")]
          .filter((el) => el.offsetParent && getComputedStyle(el).fontStyle === "italic")
          .map((el) => el.textContent!.trim().slice(0, 30)),
      )),
    );
  }
  expect(italic).toEqual([]);
});

test("the expert review tiers are three cards, one per row on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/pricing");
  const columns = () =>
    page.evaluate(() => new Set([...document.querySelectorAll<HTMLElement>(".xrow")].map((c) => Math.round(c.getBoundingClientRect().left))).size);
  expect(await page.locator(".xrow").count()).toBe(3);
  expect(await columns()).toBe(3);
  await page.setViewportSize({ width: 390, height: 800 });
  expect(await columns()).toBe(1);
});

test("About and Pledge principles are cards in a grid, not ruled rows", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [path, perRow, rows] of [["/about", 4, 1], ["/pledge", 5, 2]] as const) {
    await page.goto(path);
    const first = page.locator(".vrows").first();
    expect(await first.locator(".vrow").count(), path).toBe(perRow);
    const lefts = await first.locator(".vrow").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    const tops = await first.locator(".vrow").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    expect(new Set(tops).size, `${path}: rows of cards`).toBe(rows);
    expect(lefts.length, path).toBe(perRow);
    const style = await first.locator(".vrow").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.borderTopWidth, s.borderRadius];
    });
    expect(style, path).toEqual(["1px", "12px"]);
  }
});
