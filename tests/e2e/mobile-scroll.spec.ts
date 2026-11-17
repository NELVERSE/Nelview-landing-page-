import { test, expect } from "./fixtures";

// On a phone the page must behave as one fixed-width column that only scrolls
// up and down: no sideways drag, no bounce, and a header that stays still.
const PAGES = ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/contact", "/journal-guide", "/resources", "/apply", "/waitlist", "/article?p=desk-rejection"];

test.use({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true });

test("the page cannot be dragged sideways", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await page.evaluate(() => (window as any).nvRevealAll?.());
    const result = await page.evaluate(() => {
      scrollTo(120, 0);
      return { x: scrollX, wide: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    expect(result, path).toEqual({ x: 0, wide: 0 });
  }
});

test("html and body are not scroll containers and the page does not bounce", async ({ page }) => {
  await page.goto("/");
  const style = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    return { htmlX: html.overflowX, bodyX: body.overflowX, bounce: html.overscrollBehaviorY, drift: html.overscrollBehaviorX };
  });
  expect(style).toEqual({ htmlX: "visible", bodyX: "visible", bounce: "none", drift: "none" });
});

test("the header shadow does not flicker near the top of the page", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    (window as any).__flips = 0;
    const hdr = document.getElementById("hdr")!;
    new MutationObserver(() => ((window as any).__flips += 1)).observe(hdr, { attributes: true, attributeFilter: ["class"] });
  });
  // The bounce at the top moves the scroll position back and forth across the old 8px line.
  for (let i = 0; i < 12; i++) {
    await page.evaluate((y) => scrollTo(0, y), i % 2 ? 2 : 14);
    await page.waitForTimeout(20);
  }
  expect(await page.evaluate(() => (window as any).__flips), "class changes while hovering near the top").toBe(0);
  await page.evaluate(() => scrollTo(0, 400));
  await expect(page.locator("#hdr")).toHaveClass(/sc/);
  await page.evaluate(() => scrollTo(0, 10));
  await expect(page.locator("#hdr")).toHaveClass(/sc/);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator("#hdr")).not.toHaveClass(/sc/);
});

test("the header stays pinned to the top while scrolling", async ({ page }) => {
  await page.goto("/");
  for (const y of [300, 900, 1500, 2400]) {
    await page.evaluate((v) => scrollTo(0, v), y);
    await page.waitForTimeout(60);
    const top = await page.evaluate(() => Math.round(document.getElementById("hdr")!.getBoundingClientRect().top));
    expect(top, `scrollY ${y}`).toBe(0);
  }
});
