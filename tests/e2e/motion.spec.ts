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
  await page.goto("/");
  const heading = page.locator("main h1");
  await expect(heading).toBeVisible();
  await expect
    .poll(() => heading.evaluate((el) => getComputedStyle(el).opacity), {
      timeout: 3000,
    })
    .toBe("1");
});

test("following a link in the header lands on that page", async ({ page }) => {
  await page.goto("/");
  await page.locator("header.hdr a.nl[href='pricing']").click();
  await expect(page).toHaveURL(/pricing/);
  await expect(page.locator("main h1")).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing is hidden waiting for an animation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    const waiting = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>("main *")].filter(
          (el) => el.style.opacity === "0",
        ).length,
    );
    expect(waiting).toBe(0);
  });
});

test("the tools row scrolls by itself from left to right", async ({ page }) => {
  await page.goto("/");
  const first = () => page.evaluate(() => document.querySelector(".logo-track li")!.getBoundingClientRect().left);
  const before = await first();
  await page.waitForTimeout(600);
  expect(await first(), "logos move rightwards").toBeGreaterThan(before + 5);
  // Two identical lists, one hidden from screen readers, so the loop has no seam.
  const lists = await page.evaluate(() => [...document.querySelectorAll(".logo-track")].map((ul) => ul.textContent));
  expect(lists).toHaveLength(2);
  expect(lists[0]).toBe(lists[1]);
  await expect(page.locator(".logo-track").nth(1)).toHaveAttribute("aria-hidden", "true");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the tools row stays still and shows each tool once", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".logo-track").nth(1)).toBeHidden();
    const first = () => page.evaluate(() => document.querySelector(".logo-track li")!.getBoundingClientRect().left);
    const before = await first();
    await page.waitForTimeout(400);
    expect(await first()).toBe(before);
  });
});
