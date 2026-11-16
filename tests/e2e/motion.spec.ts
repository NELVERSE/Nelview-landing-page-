import { test, expect } from "./fixtures";

// These run with animations on, the way most visitors see the site.
test.use({ reducedMotion: "no-preference" });

const pages = ["/", "/about", "/pricing", "/institutions", "/experts", "/pledge"];

for (const path of pages) {
  test(`${path}: nothing stays hidden after scrolling through`, async ({ page }) => {
    await page.goto(path);
    // Scroll the way a reader would, then let the reveals finish.
    await page.evaluate(async () => {
      const step = Math.round(innerHeight * 0.6);
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 120));
      }
    });
    await page.waitForTimeout(1800);

    const hidden = await page.evaluate(() => {
      const stuck: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        "main h1, main h2, main h3, main p, main img, main .card, main .photo, main .btn",
      )) {
        if (!el.offsetParent) continue; // not rendered at all (inactive tab, etc.)
        if (el.closest(".tour, .demo-vid, .tpane, [data-pane]")) continue;
        const style = getComputedStyle(el);
        const clipped = /inset\((100%|0px 0px 100%)/.test(style.clipPath);
        if (parseFloat(style.opacity) < 0.99 || clipped)
          stuck.push(
            `${el.tagName}.${el.className} "${(el.textContent || "").trim().slice(0, 30)}" opacity=${style.opacity} clip=${style.clipPath}`,
          );
      }
      return stuck;
    });
    expect(hidden).toEqual([]);
  });
}

test("the hero is readable straight away", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("nv_intro", "1"));
  await page.goto("/");
  const heading = page.locator("main h1");
  await expect(heading).toBeVisible();
  // The headline is revealed by un-clipping it from the bottom up.
  await expect
    .poll(
      () =>
        heading.evaluate((el) => {
          const clip = getComputedStyle(el).clipPath.match(
            /inset\(\S+ \S+ (-?[\d.]+)%/,
          );
          return clip ? parseFloat(clip[1]) : 0;
        }),
      { timeout: 3000 },
    )
    .toBeLessThanOrEqual(0);
});

test("following a link plays the page transition and lands on the page", async ({
  page,
}) => {
  await page.addInitScript(() => sessionStorage.setItem("nv_intro", "1"));
  await page.goto("/");
  await page.locator("header.hdr a.nl[href='pricing.html']").click();
  await expect(page).toHaveURL(/pricing/);
  await expect(page.locator("main h1")).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no animation layer is added and content is simply there", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".nv-veil, .nv-intro, .nv-prog")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveClass(/lenis/);
    await expect(page.locator("main h1")).toBeVisible();
  });
});
