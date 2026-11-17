import { devices } from "@playwright/test";
import { test, expect } from "./fixtures";

// The home page once crashed phones while scrolling. These guard the causes:
// work that ran on every frame whether or not anything was visible.
// Phone-sized and touch-driven, on the same browser engine as the other tests.
const phone = devices["iPhone 13"];
test.use({
  viewport: phone.viewport,
  deviceScaleFactor: phone.deviceScaleFactor,
  isMobile: true,
  hasTouch: true,
  userAgent: phone.userAgent,
  reducedMotion: "no-preference",
});

/** Layouts and style recalculations per second over a two-second window. */
async function idleWork(page: import("@playwright/test").Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  const read = async () => {
    const { metrics } = await cdp.send("Performance.getMetrics");
    const value = (name: string) => metrics.find((m) => m.name === name)!.value;
    return { layouts: value("LayoutCount"), styles: value("RecalcStyleCount") };
  };
  const before = await read();
  await page.waitForTimeout(2000);
  const after = await read();
  return {
    layoutsPerSecond: (after.layouts - before.layouts) / 2,
    stylesPerSecond: (after.styles - before.styles) / 2,
  };
}

test("the page does no layout work on its own while the hero is showing", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500); // entrance animations finish
  expect((await idleWork(page)).layoutsPerSecond).toBeLessThan(5);
});

test("nothing animates once the hero has scrolled away", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator('[data-screen-label="Problem"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500); // reveals finish
  const work = await idleWork(page);
  expect(work.layoutsPerSecond).toBeLessThan(5);
  expect(work.stylesPerSecond).toBeLessThan(5);
});

test("the product video downloads nothing until it is played", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const video = page.locator(".hero-media video");
  await expect(video).toHaveAttribute("preload", "none");
  expect(await video.evaluate((el: HTMLVideoElement) => el.controls)).toBe(false);
  for (const url of [
    await video.evaluate((el: HTMLVideoElement) => el.poster),
    await video.locator("source").evaluate((el: HTMLSourceElement) => el.src),
  ])
    expect((await request.head(url)).status(), url).toBe(200);

  await page.locator(".hero-play").click();
  await expect(page.locator(".hero-play")).toBeHidden();
  expect(await video.evaluate((el: HTMLVideoElement) => el.controls)).toBe(true);
});
