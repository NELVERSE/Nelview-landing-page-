import { test as base, expect } from "@playwright/test";

/** What the fake forms backend should do with the next submissions. */
export type Backend = {
  /** ok: accepts. down: network failure. reject: answers { ok: false }. garbage: answers with an HTML error page. */
  mode: "ok" | "down" | "reject" | "garbage";
  /** Every submission the site sent, parsed. */
  posts: Record<string, any>[];
};

export const ACCEPTED = {
  ok: true,
  position: 42,
  reference: "NV-BETA-123456",
  ref_code: "ama7k2q",
  count: 42,
};

export const test = base.extend<{ backend: Backend; pageErrors: string[] }>({
  // The site posts to a Google Apps Script URL. Tests never reach it.
  backend: [
    async ({ context }, use) => {
      const backend: Backend = { mode: "ok", posts: [] };
      await context.route("https://script.google.com/**", async (route) => {
        const request = route.request();
        if (request.method() !== "POST")
          return route.fulfill({ json: { count: 42 } });
        backend.posts.push(JSON.parse(request.postData() || "{}"));
        if (backend.mode === "down") return route.abort();
        if (backend.mode === "garbage")
          return route.fulfill({
            status: 500,
            contentType: "text/html",
            body: "<h1>Error</h1>",
          });
        return route.fulfill({
          json: backend.mode === "reject" ? { ok: false } : ACCEPTED,
        });
      });
      await use(backend);
    },
    { auto: true },
  ],

  // Any uncaught script error fails the test that caused it.
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await use(errors);
      expect(errors, "uncaught script errors").toEqual([]);
    },
    { auto: true },
  ],

  // The consent banner sits over the bottom of the page; treat it as answered.
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem("nv_consent", "test");
      } catch {}
    });
    await use(page);
  },
});

export { expect };
