import { test, expect } from "./fixtures";

const FAILURES = ["down", "reject", "garbage"] as const;

test.describe("waitlist", () => {
  test("a shared referral link reaches the waitlist and credits the referrer", async ({
    page,
    backend,
  }) => {
    await page.goto("/beta?ref=kofi1234");
    await expect(page).toHaveURL(/waitlist(\.html)?\?ref=kofi1234$/);

    await page.fill("#f_name", "Ama Mensah");
    await page.fill("#f_email", "ama@ucc.edu.gh");
    await page.selectOption("#f_country", { index: 1 });
    await page.selectOption("#f_role", { index: 1 });
    await page.click("#n1");
    await page.fill("#f_inst", "UCC");
    await page.locator("#fields .chip").nth(1).click();
    await page.locator("#needs .chip").nth(2).click();
    await page.click("#n2");
    await page.check("#f_agree");

    // A failed request must never look like a confirmed place in line.
    for (const mode of FAILURES) {
      backend.mode = mode;
      await page.click("#go");
      await expect(page.locator("#e4")).toBeVisible();
      await expect(page.locator("#ok")).not.toHaveClass(/\bon\b/);
      await expect(page.locator("#go")).toBeEnabled();
    }

    backend.mode = "ok";
    await page.click("#go");
    await expect(page.locator("#ok")).toHaveClass(/\bon\b/);
    await expect(page.locator("#wlNum")).toHaveText("#42");
    await expect(page.locator("#refno")).toHaveText("NV-BETA-123456");
    await expect(page.locator("#refLink")).toHaveValue(/ref=ama7k2q$/);
    await expect(page.locator("#e4")).toBeHidden();

    expect(backend.posts.at(-1)).toMatchObject({
      stage: "Full application",
      email: "ama@ucc.edu.gh",
      fields: "Medicine & Health",
      reviews: "Thesis / dissertation",
      referred_by: "kofi1234",
    });
  });

  test("the hero's Get started button opens the waitlist", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hero2 .hero-cta a", { hasText: "Get started" }).click();
    await expect(page).toHaveURL(/waitlist/);
    await expect(page.locator("#f_email")).toBeVisible();
  });
});

test.describe("contact", () => {
  test("a failed demo request keeps the form, then succeeds on retry", async ({
    page,
    backend,
  }) => {
    await page.goto("/contact");
    const form = page.locator("#ctForm");
    await form.locator("[name=name]").fill("Kofi A");
    await form.locator("[name=email]").fill("k@ug.edu.gh");
    await form.locator("[name=institution]").fill("UG");
    await form.locator("textarea").fill("Show me");

    backend.mode = "down";
    await page.click("#ctBtn");
    await expect(page.locator(".nv-send-err")).toBeVisible();
    await expect(form).toBeVisible();
    await expect(form.locator("[name=name]")).toHaveValue("Kofi A");
    await expect(page.locator("#demoDone")).toBeHidden();

    backend.mode = "ok";
    await page.click("#ctBtn");
    await expect(page.locator("#demoDone")).toContainText("Thanks, Kofi");
    await expect(page.locator(".nv-send-err")).toBeHidden();
    await expect(page.locator(".ct-tabs")).toBeHidden();
    expect(backend.posts.at(-1)).toMatchObject({
      stage: "Demo request",
      institution: "UG",
    });
  });

  test("the general contact tab sends a contact message", async ({
    page,
    backend,
  }) => {
    await page.goto("/contact?topic=contact");
    const form = page.locator("#ctForm");
    await form.locator("[name=name]").fill("Kofi A");
    await form.locator("[name=email]").fill("k@ug.edu.gh");
    await form.locator("textarea").fill("Hello");
    await page.click("#ctBtn");
    await expect(page.locator("#demoDone")).toContainText("Message sent");
    expect(backend.posts.at(-1)).toMatchObject({
      stage: "Contact message",
      message: "Hello",
    });
  });
});

test.describe("newsletter and alerts", () => {
  test("a rejected signup shows an error and can be retried", async ({
    page,
    backend,
  }) => {
    await page.goto("/resources");
    const form = page.locator("form[data-list='Newsletter']");
    await form.locator("input[type=email]").fill("n@x.org");

    backend.mode = "reject";
    await form.locator("button").click();
    await expect(page.locator(".nv-send-err")).toBeVisible();
    await expect(form).toBeVisible();

    backend.mode = "ok";
    await form.locator("button").click();
    await expect(page.locator(".subok")).toBeVisible();
    await expect(page.locator(".nv-send-err")).toHaveCount(0);
    expect(backend.posts.at(-1)).toMatchObject({ stage: "Newsletter" });
  });

  test("the send error is translated in French", async ({ page, backend }) => {
    await page.goto("/resources");
    await page.evaluate(() => (window as any).nvLang("fr", true));
    backend.mode = "down";
    await page.locator("form[data-list='Newsletter'] input[type=email]").fill("n@x.org");
    await page.locator("form[data-list='Newsletter'] button").click();
    await expect(page.locator(".nv-send-err")).toContainText("L'envoi a échoué");
  });

  test("grant alerts sign up from the pledge page", async ({ page, backend }) => {
    await page.goto("/pledge");
    await page.locator("form[data-list] input[type=email]").fill("n@x.org");
    await page.locator("form[data-list] button").click();
    await expect(page.locator(".subok")).toBeVisible();
    expect(backend.posts.at(-1)).toMatchObject({ stage: "Pledge grant alerts" });
  });
});

test.describe("reviewer application", () => {
  /** Fills whatever the current step shows. */
  async function fillStep(page: import("@playwright/test").Page) {
    const inputs = page.locator(
      "#apf input:visible:not([type=checkbox]):not([type=file]):not([type=radio])",
    );
    for (const input of await inputs.all()) {
      const name = await input.getAttribute("name");
      const type = await input.getAttribute("type");
      await input.fill(
        name === "orcid"
          ? "0000-0002-1825-0097"
          : type === "email"
            ? "r@uni.edu"
            : name === "name"
              ? "Dr Esi Boateng"
              : "Text",
      );
    }
    for (const select of await page.locator("#apf select:visible").all())
      await select.selectOption({ index: 1 });
    for (const area of await page.locator("#apf textarea:visible").all())
      await area.fill("note");
    for (const group of await page.locator("#apf [data-chips]:visible").all())
      if (!(await group.locator(".chip.on").count()))
        await group.locator(".chip").first().click();
  }

  test("sends the CV file itself and reports failures honestly", async ({
    page,
    backend,
  }) => {
    await page.goto("/apply");
    await fillStep(page);
    await page.click("#next");
    await fillStep(page);
    await page.click("#next");
    await fillStep(page);

    // Over the 10 MB limit: refused on the spot.
    await page.setInputFiles("#cv", {
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(11 * 1024 * 1024, 1),
    });
    await expect(page.locator("#cvl")).toContainText("over 10 MB");
    await page.click("#next");
    await expect(page.locator("#cnt")).toHaveText("Step 3 of 4");

    const cv = Buffer.from("%PDF-1.4 test cv é");
    await page.setInputFiles("#cv", {
      name: "cv.pdf",
      mimeType: "application/pdf",
      buffer: cv,
    });
    await page.click("#next");
    await fillStep(page);
    await page.check("#agree");

    backend.mode = "down";
    await page.click("#next");
    await expect(page.locator(".nv-send-err")).toBeVisible();
    await expect(page.locator("#apf")).toBeVisible();
    await expect(page.locator("#apdone")).toBeHidden();

    backend.mode = "ok";
    await page.click("#next");
    await expect(page.locator("#apdone")).toBeVisible();
    await expect(page.locator("#dn")).toHaveText("Esi");

    const sent = backend.posts.at(-1)!;
    expect(sent).toMatchObject({
      stage: "Expert application",
      cv_file: "cv.pdf",
      cv: { name: "cv.pdf", type: "application/pdf" },
    });
    expect(Buffer.from(sent.cv.data, "base64").equals(cv)).toBe(true);
    // Names the backend's sheet columns and team email expect.
    for (const field of ["reviews", "capacity", "institution"])
      expect(sent[field], field).toBeTruthy();
  });
});
