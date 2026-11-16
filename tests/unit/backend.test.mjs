// Runs apps-script/Code.gs under Node with small stand-ins for the Google
// services it uses, so the form backend's behaviour is checked without a deploy.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

const CODE = readFileSync(new URL("../../apps-script/Code.gs", import.meta.url), "utf8");

function makeSheet() {
  const rows = [];
  return {
    rows,
    getLastRow: () => rows.length,
    getLastColumn: () => (rows[0] || []).length,
    appendRow: (row) => void rows.push(row.slice()),
    getRange: (r, c, numRows = 1, numCols = 1) => ({
      getValues: () =>
        rows.slice(r - 1, r - 1 + numRows).map((row) =>
          Array.from({ length: numCols }, (_, i) => row[c - 1 + i] ?? ""),
        ),
      setValue: (value) => {
        while (rows.length < r) rows.push([]);
        rows[r - 1][c - 1] = value;
      },
    }),
  };
}
function makeBook() {
  const tabs = {};
  return {
    tabs,
    getSheetByName: (name) => tabs[name] || null,
    insertSheet: (name) => (tabs[name] = makeSheet()),
  };
}

/** A fresh script instance. `driveFails` / `mailFails` make those services throw. */
function deploy({ driveFails = false, mailFails = false } = {}) {
  const book = makeBook();
  const demoBook = makeBook();
  const files = [];
  const mails = [];
  const logs = [];
  const sendMail = (entry) => {
    if (mailFails) throw new Error("quota exceeded");
    mails.push(entry);
  };
  const context = vm.createContext({
    console: { error: (message) => logs.push(message), log() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      openById: () => demoBook,
      flush() {},
    },
    LockService: { getScriptLock: () => ({ tryLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 1 },
      computeDigest: (_algorithm, text) => [...createHash("sha256").update(text).digest()],
      base64Decode: (text) => [...Buffer.from(text, "base64")],
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
      formatDate: () => "2026-01-02",
    },
    DriveApp: {
      getFoldersByName: () => ({ hasNext: () => false }),
      createFolder: () => {
        if (driveFails) throw new Error("drive unavailable");
        return {
          createFile: (blob) => {
            files.push(blob);
            return { getUrl: () => `https://drive.example/${files.length}` };
          },
        };
      },
    },
    GmailApp: { getAliases: () => [], sendEmail: (to, subject) => sendMail({ to, subject }) },
    MailApp: { sendEmail: (options) => sendMail(options) },
  });
  vm.runInContext(CODE, context);
  const post = (body) => context.doPost({ postData: { contents: JSON.stringify(body) } });
  /** First data row of a tab as { column: value }. */
  const row = (tab, source = book) => {
    const { rows } = source.tabs[tab];
    return Object.fromEntries(rows[0].map((header, i) => [header, rows[1][i]]));
  };
  return { book, demoBook, files, mails, logs, post, row };
}

const PDF = Buffer.from("%PDF-1.4 hello").toString("base64");
const expert = (extra) => ({
  stage: "Expert application",
  name: "Dr Ama <b>Mensah</b>",
  email: "ama@ucc.edu.gh",
  reviews: "10–50",
  capacity: "3–5",
  cv_file: "cv.pdf",
  ...extra,
});

test("reviewer application: the CV is stored and linked from the sheet", () => {
  const script = deploy();
  const result = script.post(expert({ cv: { name: "My CV.PDF", type: "application/pdf", data: PDF } }));
  assert.deepEqual(result, { ok: true });
  assert.equal(script.files.length, 1);
  assert.equal(script.files[0].type, "application/pdf");
  assert.equal(script.files[0].name, "Dr Ama bMensahb - CV - 2026-01-02.pdf");
  const row = script.row("Expert Applications");
  assert.equal(row.cv_url, "https://drive.example/1");
  assert.equal(row.reviews, "10–50");
  assert.equal(row.capacity, "3–5");
  assert.ok(!("cv" in row), "the raw file must never reach a sheet cell");
  assert.equal(script.mails.length, 2, "applicant confirmation + team alert");
});

test("reviewer application: unusable files are dropped but the application is kept", () => {
  for (const cv of [
    { name: "evil.exe", data: PDF },
    { name: "big.pdf", data: "A".repeat(14 * 1024 * 1024) },
    "not-an-object",
  ]) {
    const script = deploy();
    assert.ok(script.post(expert({ cv })).ok);
    assert.equal(script.files.length, 0);
    assert.equal(script.row("Expert Applications").cv_url, "(file not stored)");
  }
});

test("reviewer application: a Drive failure does not lose the application", () => {
  const script = deploy({ driveFails: true });
  assert.ok(script.post(expert({ cv: { name: "cv.pdf", data: PDF } })).ok);
  assert.equal(script.row("Expert Applications").cv_url, "(file not stored)");
  assert.match(script.logs[0], /CV upload failed/);
});

test("a failed email still reports the stored submission as successful", () => {
  let script = deploy({ mailFails: true });
  assert.deepEqual(script.post(expert({})), { ok: true });
  assert.equal(script.book.tabs["Expert Applications"].rows.length, 2);

  script = deploy({ mailFails: true });
  const waitlist = script.post({ stage: "Full application", name: "Kofi", email: "k@ug.edu.gh" });
  assert.equal(waitlist.ok, true);
  assert.equal(waitlist.position, 1);
  assert.match(waitlist.reference, /^NV-BETA-\d{6}$/);

  script = deploy({ mailFails: true });
  assert.ok(script.post({ stage: "Demo request", name: "Kofi", email: "k@ug.edu.gh" }).ok);
  assert.equal(script.demoBook.tabs["Demo Requests"].rows.length, 2);
});

test("waitlist: the same email returns its existing place instead of a second row", () => {
  const script = deploy();
  const first = script.post({ stage: "Full application", name: "Kofi", email: "k@ug.edu.gh" });
  const again = script.post({ stage: "Full application", name: "Kofi", email: "K@ug.edu.gh" });
  assert.equal(again.returning, true);
  assert.equal(again.reference, first.reference);
  assert.equal(script.book.tabs.Applications.rows.length, 2);
});

test("contact: formulas typed into a field are stored as plain text", () => {
  const script = deploy();
  assert.ok(script.post({ stage: "Contact message", name: "Kofi", email: "k@ug.edu.gh", message: "=HYPERLINK(1)" }).ok);
  assert.equal(script.row("Contact").message, "'=HYPERLINK(1)");
});

test("newsletter: a second signup is recognised as a duplicate", () => {
  const script = deploy();
  assert.ok(script.post({ stage: "Newsletter", email: "n@x.org" }).ok);
  assert.equal(script.post({ stage: "Newsletter", email: "n@x.org" }).duplicate, true);
  assert.equal(script.book.tabs.Subscribers.rows.length, 2);
});

test("an invalid email is reported as a failure", () => {
  assert.equal(deploy().post({ stage: "Newsletter", email: "bad" }).ok, false);
});

test("a filled honeypot looks successful but stores and sends nothing", () => {
  const script = deploy();
  assert.ok(script.post(expert({ hp: "bot", cv: { name: "cv.pdf", data: PDF } })).ok);
  assert.equal(script.files.length, 0);
  assert.equal(script.mails.length, 0);
  assert.equal(script.book.tabs["Expert Applications"], undefined);
});
