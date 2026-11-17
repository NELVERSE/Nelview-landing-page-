import { test, expect } from "./fixtures";

// French mode must translate the pages, not just the home page. For each page
// this counts the real sentences and headings (lowercase words, several of
// them) that are still identical to the English text; names, figures, emails
// and brand terms are not counted.
const PAGES = [
  "/",
  "/pricing",
  "/institutions",
  "/experts",
  "/pledge",
  "/about",
  "/faq",
  "/contact",
  "/journal-guide",
  "/resources",
  "/apply",
  "/waitlist",
  "/article?p=predatory-journals",
  "/article?p=desk-rejection",
  "/article?p=stats-mistakes",
];

async function sentences(page: import("@playwright/test").Page, url: string, lang: string) {
  await page.addInitScript((l) => {
    try {
      localStorage.setItem("nv_consent", "1");
      localStorage.setItem("nv_lang", l);
    } catch {}
  }, lang);
  await page.goto(url);
  await page.waitForTimeout(300);
  await page.evaluate(() => (window as any).nvRevealAll?.());
  return page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const text = (node.nodeValue || "").replace(/\s+/g, " ").trim();
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/.test(parent.tagName)) continue;
      if (text.split(" ").length >= 4 && /[a-z]{3}/.test(text)) out.push(text);
    }
    return out;
  });
}

for (const url of PAGES) {
  test(`french: ${url} is translated`, async ({ browser }) => {
    const english = await (async () => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      const found = await sentences(page, url, "en");
      await ctx.close();
      return found;
    })();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const french = new Set(await sentences(page, url, "fr"));
    await ctx.close();
    const untranslated = english.filter((text) => french.has(text));
    expect(untranslated, "sentences still English in French mode").toEqual([]);
  });
}

// French words are longer, so a layout sized for English can split them
// mid-word. Same check as text.spec.ts, run in French on desktop and phone.
for (const width of [1280, 390]) {
  for (const url of PAGES.filter((u) => !u.includes("?"))) {
    test(`french ${width}px: ${url} has no word split mid-word`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem("nv_consent", "1");
          localStorage.setItem("nv_lang", "fr");
        } catch {}
      });
      await page.goto(url);
      await page.waitForTimeout(300);
      await page.evaluate(() => (window as any).nvRevealAll?.());
      await page.addStyleTag({ content: "*{overflow-wrap:normal!important;word-break:normal!important}" });
      const split = await page.evaluate(() => {
        const found: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>("main *, footer *")) {
          if (el.children.length) continue;
          const text = (el.textContent || "").trim();
          if (text.length < 3) continue;
          if (el.closest("svg, script, style, input, textarea, select, .mock, .app, [data-ring], video, code, pre")) continue;
          if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1)
            found.push(`${el.tagName.toLowerCase()}.${el.className} "${text.slice(0, 30)}"`);
        }
        return found;
      });
      await ctx.close();
      expect(split, "French text that would be split mid-word").toEqual([]);
    });
  }
}
