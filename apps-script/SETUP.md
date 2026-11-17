# Collect Nelview beta applications in a Google Sheet

This sends every landing-page email signup and every full application straight
into a Google Sheet (openable in Excel). ~5 minutes, free, no add-ons.

## 1. Make the sheet

1. Go to https://sheets.new — name it e.g. **Nelview Beta Applications**.

## 2. Add the script

2. In the sheet: **Extensions → Apps Script**.
3. Delete whatever is there, open `apps-script/Code.gs` from this repository,
   copy **all** of it, paste it in, and click the **Save** icon.

   That one script handles every form on the site: the waitlist and full
   application, expert applications (with the CV saved to Drive), contact
   messages, demo requests, the newsletter and the Research Pledge alerts. The
   forms are told apart by the `stage` value they send.

## 3. Deploy it as a web app

4. Top-right **Deploy → New deployment**.
5. Click the gear next to "Select type" → choose **Web app**.
6. Settings:
   - **Description:** anything (e.g. "Nelview beta intake")
   - **Execute as:** **Me**
   - **Who has access:** **Anyone** ← important, so the website can post to it
7. **Deploy** → authorize when prompted (pick your account → Advanced → "Go to … (unsafe)" → Allow — this is normal for your own script).
8. Copy the **Web app URL** (ends in `/exec`).

## 4. Connect the site

Paste that `/exec` URL between the quotes of `SHEET_ENDPOINT` in **two** files:

- `Join the Beta.html` → `var SHEET_ENDPOINT='';`
- `Nelview.html` → `var SHEET_ENDPOINT='';`

…or just send me the URL and I'll drop it into both.

## Done

New rows appear in the **Applications** tab in real time. Columns:
`submitted_at, stage, name, email, country, role, institution, fields, reviews,
supervises, working_on, heard`.

- **stage** = `Email signup` (landing page) or `Full application` (full form).
- **reviews** includes "Grant proposal" when they're seeking grant review.
- **supervises** captures MSc / PhD / both.

Download/export from Google Sheets any time via **File → Download → Microsoft Excel (.xlsx)**.

### Notes

- The site uses `mode:'no-cors'`, so the browser won't show the script's response — that's expected; rows still land. Test by submitting once and checking the sheet.
- `localStorage` + the `#admin` CSV export still work as a local backup even after the Sheet is connected.

## Update — live place in line + reference (2026-09-29)

1. Open the Apps Script project bound to the beta sheet → replace **Code.gs** with the new version in this project.
2. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.** Keep the same web-app URL (the site already uses it).
   Access must stay **Anyone**.
3. The script adds three columns to "Applications" automatically: `position`, `reference`, `ref_code`.
   Existing rows keep working; they just have blank references until they re-apply (same email returns their spot).

What the site now gets back after submitting: `{ ok, position, reference, ref_code, referrals, total }`.

- **Place in line** = sign-up order, moved up 3 places per friend who joins with their link. Re-checked every 20 s while the page is open.
- **Reference** is generated and stored server-side, and included in the confirmation email.
- **Share link** `nelview.com/beta?ref=CODE` credits the referrer automatically.
- Same email twice → no duplicate row; the page shows their existing spot.

## Update — every form now writes to the sheet

| Form                        | Page                   | Stage sent                  | Where it lands                       |
| --------------------------- | ---------------------- | --------------------------- | ------------------------------------ |
| Beta waitlist               | web/waitlist.html      | Full application            | Beta sheet → **Applications**        |
| Book a demo                 | web/contact.html       | Demo request                | Demo sheet → **Demo Requests**       |
| Talk to sales               | Institution Onboarding | Demo request (institutions) | Demo sheet → **Demo Requests**       |
| Institution sign-up wizard  | Institution Onboarding | Institution signup          | Beta sheet → **Institution Signups** |
| Expert reviewer application | web/apply.html         | Expert application          | Beta sheet → **Expert Applications** |
| Newsletter                  | web/resources.html     | Newsletter                  | Beta sheet → **Subscribers**         |
| Grant alerts                | web/pledge.html        | Pledge grant alerts         | Beta sheet → **Subscribers**         |

New tabs are created on the first submission. Expert applicants get a branded confirmation; every form alerts team@nelview.com.
The home-page email box only pre-fills the waitlist (not stored on its own, so it can't create duplicate waitlist rows).
CV files were not uploaded at this point — only the file name was stored (changed below). Redeploy (Manage deployments → New version) after pasting the new Code.gs.

## Update — website forms only (portals connect at launch)

Team alerts now go to **team@nelview.com and nelviewai@gmail.com**.

| Website form                                                             | Tab                        | Emails                              |
| ------------------------------------------------------------------------ | -------------------------- | ----------------------------------- |
| Join waitlist (Sign in leads here)                                       | Applications               | Applicant confirmation + team alert |
| Expert / human reviewer application                                      | Expert Applications        | Applicant confirmation + team alert |
| Institution demo / "Set up your institution" (contact.html)              | Demo Requests (demo sheet) | Requester confirmation + team alert |
| General contact (contact.html → General contact tab)                     | Contact                    | Sender confirmation + team alert    |
| Newsletter / grant alerts                                                | Subscribers                | Team alert                          |
| Institution Onboarding wizard and all portals are **not** connected yet. |

## Update — reviewer CVs are uploaded, and the site waits for a real answer

**This update needs a redeploy and one new permission.**

1. Paste the new `Code.gs` into the Apps Script editor.
2. In the editor, pick any function (for example `testBeta`) and press **Run** once. Google asks you to approve access to **Google Drive** — the script now saves CVs there. Approve it.
3. **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.** The web-app URL stays the same.

What changed:

- **CV upload.** The reviewer application now sends the actual file (PDF or Word, up to 10 MB). The script saves it to a Drive folder called **Nelview reviewer CVs**, owned by the account that deploys the script, and writes the link to a new `cv_url` column in **Expert Applications** and into the team alert email. The folder is private: share it with whoever screens applications. If a file cannot be stored, the application is still saved and `cv_url` reads `(file not stored)`.
- **Until you redeploy**, the old script ignores the file: applications still arrive with the file name only, and a stray `cv` column containing `[object Object]` appears in **Expert Applications**. Delete that column after redeploying.
- **Honest confirmations.** Every form on the site now waits for this script's reply and shows an error (with the visitor's entries kept) if it does not get `{ ok: true }`. So the note above about `mode: 'no-cors'` no longer applies: the site reads the response.
- **Emails can no longer fail a submission.** If a confirmation or team alert cannot be sent (for example the daily email quota is used up), the row is still stored and the visitor still sees success. The failure is logged under **Executions** in the Apps Script editor.
