import { test, expect } from "./fixtures";

// On a phone, cards must use their width: the icon sits beside its title, not
// above it, and visuals fill the card instead of floating in empty space.
const PAGES = ["/", "/institutions", "/experts", "/contact", "/pledge"];

for (const width of [360, 390, 430]) {
  test.describe(`cards on a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const path of PAGES) {
      test(`${path}: icons sit beside their titles`, async ({ page }) => {
        await page.goto(path);
        await page.evaluate(() => (window as any).nvRevealAll?.());
        const stacked = await page.evaluate(() => {
          const bad: string[] = [];
          for (const icon of document.querySelectorAll<HTMLElement>("main .ico")) {
            const card = icon.parentElement;
            const next = icon.nextElementSibling;
            if (!card || !next || card.firstElementChild !== icon) continue;
            if (!card.offsetWidth || card.closest(".upl, .done")) continue;
            const a = icon.getBoundingClientRect();
            const n = next.getBoundingClientRect();
            const beside = n.left >= a.right - 2 && n.top < a.bottom - 2;
            if (!beside)
              bad.push(`${card.className} > ${next.tagName.toLowerCase()} "${(next.textContent || "").trim().slice(0, 28)}"`);
          }
          return bad;
        });
        expect(stacked, "icons stacked above their titles").toEqual([]);
      });
    }

    test("home: feature cards use the full card width", async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => (window as any).nvRevealAll?.());
      const result = await page.evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>(".nb-c")];
        const narrow = cards
          .map((card) => {
            const visual = card.querySelector<HTMLElement>(".nb-v")!;
            return card.offsetWidth - visual.offsetWidth;
          })
          .filter((gap) => gap > 26);

        // The product pictures fill their panel from edge to edge.
        const loose = [...document.querySelectorAll<HTMLImageElement>(".nb-shot img")]
          .filter((img) => Math.abs(img.offsetWidth - img.parentElement!.offsetWidth) > 1)
          .map((img) => img.alt.slice(0, 30));

        return { narrow, loose };
      });
      expect(result.narrow, "visual inset more than the card padding").toEqual([]);
      expect(result.loose, "pictures narrower than their panel").toEqual([]);
    });
  });
}
