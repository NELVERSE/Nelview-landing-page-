import { test, expect } from "./fixtures";

// Every internal link is a clean, relative URL ("pricing", "./#faq"), so a link
// to the page you are on is a same-page jump rather than a reload, and no
// visit takes a detour through a redirect from "/pricing.html" to "/pricing".
const PAGES = ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/contact", "/journal-guide", "/resources", "/apply", "/waitlist", "/signin", "/privacy", "/terms"];

test("internal links are clean URLs that exist and point at real sections", async ({ page, request }) => {
  const seen = new Map<string, string>();
  for (const path of PAGES) {
    await page.goto(path);
    await page.evaluate(() => (window as any).nvRevealAll?.());
    for (const link of await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
        .filter((a) => a.origin === location.origin)
        .map((a) => [a.getAttribute("href")!, a.pathname + a.search + a.hash] as const),
    )) {
      expect(link[0], `${path}: ${link[0]}`).not.toMatch(/\.html/);
      seen.set(link[1], path);
    }
  }
  for (const [target, from] of seen) {
    const [route, hash] = target.split("#");
    const response = await request.get(route);
    expect(response.status(), `${from} links to ${target}`).toBe(200);
    if (hash && !/^\/(privacy|terms|cookies|security|article)/.test(route))
      expect(await response.text(), `${from} links to ${target}`).toMatch(new RegExp(`id=["']${hash}["']`));
  }
});

test("a link to a section of the current page does not reload it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.evaluate(() => ((window as any).__still_here = true));
  await page.locator(".dd-t").first().click();
  await page.locator(".dd.open a[href='./#how']").first().click();
  await expect(page).toHaveURL(/\/#how$/);
  expect(await page.evaluate(() => (window as any).__still_here), "the page reloaded").toBe(true);
  await expect(page.locator(".dd.open")).toHaveCount(0);
  const top = await page.evaluate(() => document.getElementById("how")!.getBoundingClientRect().top);
  const header = await page.evaluate(() => document.getElementById("hdr")!.getBoundingClientRect().bottom);
  expect(top).toBeGreaterThanOrEqual(header - 1);
  expect(top).toBeLessThan(header + 60);
});

test("Escape and clicking away close the header menus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/pricing");
  await page.locator(".dd-t").first().click();
  await expect(page.locator(".dd.open")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator(".dd.open")).toHaveCount(0);
  await page.locator(".dd-t").first().click();
  await page.mouse.click(1240, 700);
  await expect(page.locator(".dd.open")).toHaveCount(0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("the menu closes after a link and the page can scroll again", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => ((window as any).__still_here = true));
    await page.locator("#burger").click();
    await page.locator("#mnav summary").first().click();
    await page.locator("#mnav a[href='./#how']").first().click();
    await expect(page).toHaveURL(/\/#how$/);
    expect(await page.evaluate(() => (window as any).__still_here), "the page reloaded").toBe(true);
    await expect(page.locator("#mnav")).not.toHaveClass(/open/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("menu links reach their pages", async ({ page }) => {
    await page.goto("/");
    for (const [label, path] of [["Pricing", /\/pricing$/], ["Book a demo", /\/contact$/]] as const) {
      await page.goto("/");
      await page.locator("#burger").click();
      await page.locator("#mnav a.l", { hasText: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.locator("main h1").first()).toBeVisible();
    }
  });
});

test("arriving on a section of a generated page scrolls to it", async ({ page }) => {
  for (const url of ["/privacy#your-rights", "/terms#liability", "/article?p=predatory-journals#checks", "/institutions#supervisors"]) {
    await page.goto(url);
    const id = url.split("#")[1];
    await expect.poll(() => page.evaluate((i) => Math.round(document.getElementById(i)?.getBoundingClientRect().top ?? -1), id), url).toBeGreaterThan(60);
    expect(await page.evaluate((i) => document.getElementById(i)!.getBoundingClientRect().top, id), url).toBeLessThan(160);
  }
});

test("the language choice survives moving between pages and going back", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nv_lang", "fr"));
  await page.goto("/");
  await page.locator("header.hdr a.nl[href='pricing']").click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("main h1").first()).toContainText("Une évaluation honnête");
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
