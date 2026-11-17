import { test, expect } from "./fixtures";

// Buttons have to be readable wherever they sit: text against the colour behind
// it, including bands and panels. (A white outlined button once sat on a pale
// yellow band and could not be seen.)
const PAGES = ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/faq", "/contact", "/journal-guide", "/resources", "/apply", "/waitlist", "/signin"];

for (const width of [1280, 390]) {
  test(`buttons are readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const weak: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await page.evaluate(() => (window as any).nvRevealAll?.());
      weak.push(
        ...(await page.evaluate((route) => {
          const parse = (s: string) => {
            const m = s.match(/rgba?\(([^)]+)\)/);
            if (!m) return [0, 0, 0, 0];
            const a = m[1].split(/[ ,/]+/).map(Number);
            return [a[0], a[1], a[2], a.length > 3 ? a[3] : 1];
          };
          const lum = ([r, g, b]: number[]) => {
            const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
            return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
          };
          const over = (t: number[], b: number[]) => [0, 1, 2].map((i) => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
          const backdrop = (el: Element) => {
            const layers: number[][] = [];
            for (let e: Element | null = el; e; e = e.parentElement) {
              const bg = parse(getComputedStyle(e).backgroundColor);
              if (bg[3] > 0) {
                layers.push(bg);
                if (bg[3] >= 1) break;
              }
            }
            let acc = [255, 255, 255, 1];
            for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
            return acc;
          };
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>(".btn")) {
            if (!el.offsetParent || !(el.textContent || "").trim()) continue;
            const bg = backdrop(el);
            const fg = over(parse(getComputedStyle(el).color), bg);
            const [a, b] = [lum(fg), lum(bg)];
            const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
            if (ratio < 3) out.push(`${route}: "${el.textContent!.trim().slice(0, 30)}" ${ratio.toFixed(2)}:1`);
          }
          return out;
        }, path)),
      );
    }
    expect(weak, "buttons with too little contrast").toEqual([]);
  });
}
