import { readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures";

const dist = fileURLToPath(new URL("../../dist", import.meta.url));
const pages = readdirSync(dist)
  .filter((file) => file.endsWith(".html") && file !== "beta.html")
  .map((file) => file.replace(/\.html$/, ""));

for (const viewport of [
  { name: "desktop", width: 1366, height: 800 },
  { name: "phone", width: 390, height: 844 },
]) {
  test.describe(`every page on ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const name of pages) {
      test(`${name} loads cleanly`, async ({ page }) => {
        const failed: string[] = [];
        page.on("response", (response) => {
          if (response.status() >= 400) failed.push(response.url());
        });
        await page.goto(name === "index" ? "/" : `/${name}`);

        // Walk the page so lazy images load.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((done) => setTimeout(done, 40));
          }
        });
        await page.waitForLoadState("networkidle");

        const state = await page.evaluate(() => ({
          title: document.title,
          brokenImages: [...document.images]
            .filter((image) => image.complete && !image.naturalWidth)
            .map((image) => image.getAttribute("src")),
          sideScroll:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
          hasHeader: !!document.querySelector("header.hdr, .wl-hdr"),
        }));
        expect(state.title).toContain("Nelview");
        expect(state.brokenImages).toEqual([]);
        expect(state.sideScroll, "page scrolls sideways").toBe(false);
        expect(state.hasHeader, "site header rendered").toBe(true);
        expect(failed, "failed requests").toEqual([]);
      });
    }
  });
}

test("a missing nested URL gets a fully styled 404 page", async ({ page }) => {
  const look = () =>
    page.evaluate(() => ({
      heading: getComputedStyle(document.querySelector("h1")!).fontSize,
      font: getComputedStyle(document.body).fontFamily,
      footer: getComputedStyle(document.querySelector("footer.ftr")!)
        .backgroundColor,
      home: new URL((document.querySelector(".brand") as HTMLAnchorElement).href)
        .pathname,
    }));

  const response = await page.goto("/guides/old/missing-page");
  expect(response!.status()).toBe(404);
  await expect(page.locator("footer.ftr")).toBeVisible();
  const nested = await look();

  await page.goto("/404.html");
  await expect(page.locator("footer.ftr")).toBeVisible();
  expect(nested).toEqual(await look());
  expect(nested.home).toBe("/");
});

test("the 404 page stays inside a github.io project path", async ({ browser }) => {
  // Serve dist/ as https://nelverse.github.io/Nelview-landing-page-/...
  const context = await browser.newContext();
  const outside: string[] = [];
  await context.route("https://nelverse.github.io/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const prefix = "/Nelview-landing-page-/";
    if (!pathname.startsWith(prefix)) {
      outside.push(pathname);
      return route.fulfill({ status: 404, body: "outside the project" });
    }
    let file = join(dist, pathname.slice(prefix.length) || "index.html");
    let status = 200;
    if (!existsSync(file) || !statSync(file).isFile())
      [file, status] = [join(dist, "404.html"), 404];
    return route.fulfill({ status, path: file });
  });
  const page = await context.newPage();
  await page.goto("https://nelverse.github.io/Nelview-landing-page-/a/b/missing");
  await expect(page.locator("footer.ftr")).toBeVisible();
  await expect(page.locator(".brand").first()).toHaveAttribute(
    "href",
    "./",
  );
  expect(
    await page.evaluate(
      () => (document.querySelector(".brand") as HTMLAnchorElement).href,
    ),
  ).toBe("https://nelverse.github.io/Nelview-landing-page-/");
  expect(outside, "requests outside the project path").toEqual([]);
  await context.close();
});

test("each article describes itself to search engines", async ({ page }) => {
  await page.goto("/article?p=desk-rejection");
  const excerpt = await page.locator("#a-x").textContent();
  expect(excerpt!.length).toBeGreaterThan(40);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    excerpt!,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    excerpt!,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/article\?p=desk-rejection$/,
  );
});

test("the mobile menu opens and the language switch works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.click("#burger");
  await expect(page.locator("#mnav")).toHaveClass(/open/);
  await page.locator(".mnav [data-lang=fr]").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("h1")).toContainText("audit");
  await expect(page.locator("h1")).toContainText("recherche");
});

test("every page declares the favicon set and the files exist", async ({ page, request }) => {
  for (const path of ["/", "/pricing", "/demo/index.html"]) {
    await page.goto(path);
    const icons = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLinkElement>(
        'link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]',
      )].map((link) => link.href),
    );
    expect(icons.length, `${path} icon links`).toBe(5);
    for (const url of icons)
      expect((await request.get(url)).status(), url).toBe(200);
  }
  const manifest = await (await request.get("/site.webmanifest")).json();
  for (const icon of manifest.icons)
    expect((await request.get(`/${icon.src}`)).status(), icon.src).toBe(200);
});

test("the home page tells search engines its name, logo and cover image", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(data.map((entry: { "@type": string }) => entry["@type"])).toEqual([
    "WebSite",
    "Organization",
  ]);
  expect(data[0].name).toBe("Nelview");

  // The cover image and logo are absolute production URLs; check the files ship.
  for (const file of ["og-image.png", "icon-512.png"])
    expect((await request.head(`/${file}`)).status(), file).toBe(200);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/og-image\.png$/,
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
    "content",
    "1200",
  );
});
