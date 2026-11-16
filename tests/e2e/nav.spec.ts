import { test, expect } from "./fixtures";

// The floating navigation bar must stay put while the page scrolls underneath
// it, and the page must not jump when the bar is drawn.
for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "phone", width: 390, height: 844 },
]) {
  test.describe(`navigation bar on ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("stays still while scrolling and never shifts the page", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as any).__shift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[])
            if (!entry.hadRecentInput) (window as any).__shift += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/");
      await expect(page.locator("#hdr .wrap")).toBeVisible();
      await page.waitForTimeout(800);

      // Opaque and unblurred: a blurred translucent bar flickers over moving content.
      const style = await page.locator("#hdr .wrap").evaluate((el) => {
        const css = getComputedStyle(el);
        return { blur: css.backdropFilter, alpha: css.backgroundColor };
      });
      expect(style.blur).toBe("none");
      expect(style.alpha).not.toMatch(/rgba\(.*0\.\d+\)$/);

      // Sample the bar on every frame while scrolling down and back up.
      await page.evaluate(() => {
        const bar = document.querySelector("#hdr .wrap")!;
        (window as any).__tops = new Set<number>();
        const tick = () => {
          (window as any).__tops.add(
            Math.round(bar.getBoundingClientRect().top * 10) / 10,
          );
          requestAnimationFrame(tick);
        };
        tick();
      });
      for (let i = 0; i < 30; i++) {
        await page.mouse.wheel(0, 160);
        await page.waitForTimeout(30);
      }
      for (let i = 0; i < 30; i++) {
        await page.mouse.wheel(0, -160);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(500);

      const tops = await page.evaluate(() => [...(window as any).__tops]);
      expect(tops, "the bar moved while scrolling").toHaveLength(1);
      expect(await page.evaluate(() => (window as any).__shift)).toBeLessThan(0.02);
    });
  });
}

// Before the script draws the bar, a placeholder holds its place. If it is the
// wrong height the whole page jumps when the bar appears.
for (const width of [1440, 1024, 390]) {
  test(`the space reserved for the bar matches the bar at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.route("**/*.js", (route) => route.abort());
    await page.goto("/");
    const reserved = await page
      .locator("[data-site-header]")
      .evaluate((el) => el.getBoundingClientRect().height);
    await page.unroute("**/*.js");

    await page.goto("/");
    await expect(page.locator("#hdr")).toBeVisible();
    const drawn = await page
      .locator("#hdr")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(Math.abs(reserved - drawn)).toBeLessThan(1);
  });
}
