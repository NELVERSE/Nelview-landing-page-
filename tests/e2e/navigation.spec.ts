import { test, expect } from "./fixtures";

// Every internal link is a clean, relative URL ("pricing", "./"), so a link
// to the page you are on is a same-page jump rather than a reload, and no
// visit takes a detour through a redirect from "/pricing.html" to "/pricing".
const PAGES = ["/", "/pricing", "/institutions", "/experts", "/pledge", "/about", "/faq", "/contact", "/journal-guide", "/resources", "/apply", "/waitlist", "/signin", "/privacy", "/terms"];

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

test("a menu link to the page you are on scrolls to its top without reloading", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    (window as any).__still_here = true;
    scrollTo(0, 2400);
  });
  await page.locator(".dd-t").first().click();
  await page.locator(".dd.open a[href='./']").first().click();
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(0);
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => (window as any).__still_here), "the page reloaded").toBe(true);
  await expect(page.locator(".dd.open")).toHaveCount(0);
});

test("menu and footer links open the page they name at its top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const [from, link, to] of [
    ["/pricing", "footer a[href='institutions']", /\/institutions$/],
    ["/about", "footer a[href='journal-guide']", /\/journal-guide$/],
    ["/pricing", "header a.nl[href='pricing']", /\/pricing$/],
  ] as const) {
    await page.goto(from);
    await page.evaluate(() => scrollTo(0, 1800));
    await page.locator(link).first().click();
    await expect(page).toHaveURL(to);
    expect(new URL(page.url()).hash, `${from} -> ${link}`).toBe("");
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), `${from} -> ${link}`).toBe(0);
  }
});

test("no menu or footer link points into the middle of a page", async ({ page }) => {
  for (const path of ["/", "/pricing"]) {
    await page.goto(path);
    const hashed = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>("#hdr a, #mnav a, .ftr a")].map((a) => a.getAttribute("href")!).filter((h) => h.includes("#")),
    );
    expect(hashed, path).toEqual([]);
  }
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
    await page.evaluate(() => scrollTo(0, 2400));
    await page.locator("#mnav a[href='./']").first().click();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(0);
    await expect(page).toHaveURL(/\/$/);
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

test("the FAQ links in the menu and footer open the FAQ page at its top", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/pricing");
  await page.evaluate(() => scrollTo(0, 1500));
  await page.locator("footer a[href='faq']").click();
  await expect(page).toHaveURL(/\/faq$/);
  await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(0);
  await expect(page.locator("main h1")).toHaveText("Questions, answered.");
  expect(await page.locator("main details").count()).toBeGreaterThan(15);
  await page.goto("/");
  await page.locator(".dd-t", { hasText: "Resources" }).click();
  await page.locator(".dd.open a[href='faq']").click();
  await expect(page).toHaveURL(/\/faq$/);
});

test("pastel cards each have a button that goes somewhere real", async ({ page, request }) => {
  const expected: Record<string, number> = { "/": 3, "/pricing": 3, "/contact": 3, "/about": 2 };
  for (const [path, count] of Object.entries(expected)) {
    await page.goto(path);
    const links = await page.locator(".pcard .pbtn").evaluateAll((els) => els.map((el) => [(el as HTMLAnchorElement).getAttribute("href")!, (el as HTMLAnchorElement).pathname]));
    expect(links, path).toHaveLength(count);
    for (const [href, route] of links) {
      if (href.startsWith("mailto:")) continue;
      expect((await request.get(route)).status(), `${path} -> ${href}`).toBe(200);
    }
  }
  // The button is a real click target: it opens its page.
  await page.goto("/");
  await page.locator(".pcard .pbtn", { hasText: "See how it works" }).click();
  await expect(page).toHaveURL(/\/institutions$/);
});

test("pastel cards sit in one row with equal heights on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ["/", "/pricing", "/contact"]) {
    await page.goto(path);
    const box = await page.locator(".pcards .pcard, .xrows .pcard").evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return [Math.round(r.top), Math.round(r.height)];
      }),
    );
    expect(new Set(box.map((b) => b[0])).size, `${path}: one row`).toBe(1);
    expect(new Set(box.map((b) => b[1])).size, `${path}: equal heights`).toBe(1);
  }
});

test.describe("institutions page", () => {
  test("covers universities first, then mentors and research bodies", async ({ page }) => {
    await page.goto("/institutions");
    await expect(page.locator("main h1")).toHaveText("Rigorous review for every researcher you support.");
    const cards = page.locator("#audiences .pcard h3");
    await expect(cards).toHaveText(["Universities", "Research consultants and mentors", "Research bodies"]);
    // Universities is the main card: the widest.
    const widths = await page.locator("#audiences .pcard").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(widths[0]).toBeGreaterThan(widths[1] * 1.3);
    for (const id of ["universities", "mentors", "research-bodies"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
  });

  test("each audience button scrolls to its section", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const [label, id] of [["See mentor tools", "mentors"], ["See research bodies", "research-bodies"], ["Explore for universities", "universities"]] as const) {
      await page.goto("/institutions");
      await page.locator(".pcard .pbtn", { hasText: label }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect.poll(() => page.evaluate((i) => Math.round(document.getElementById(i)!.getBoundingClientRect().top), id)).toBeLessThan(200);
    }
  });

  test("the mentor and research-body links pre-select who is asking on the contact form", async ({ page }) => {
    for (const [role, value] of [["mentor", "Research consultant / mentor"], ["research-body", "Research body / funder"]] as const) {
      await page.goto(`/contact?topic=institution&role=${role}`);
      expect(await page.locator("select[name=role]").inputValue()).toBe(value);
    }
  });

  test("the menu and footer call it Institutions", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("footer a[href='institutions']", { hasText: /^Institutions$/ })).toHaveCount(1);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.locator(".dd-t", { hasText: "Solutions" }).click();
    await expect(page.locator(".dd.open a[href='institutions'] b, .dd.open a[href='institutions']").first()).toContainText("Institutions");
  });
});
