# Nelview website

The ultimate pre-submission audit for research. Marketing site for Nelview, in English and French.

Static multi-page site built with **Vite + TypeScript**. No framework: each page is plain HTML, styled by four CSS files and driven by five small TypeScript scripts.

## Quick start

```bash
pnpm install
pnpm run dev       # http://localhost:5173
pnpm run build     # production build in dist/
pnpm run preview   # serve dist/ locally
```

Requires Node 20+ and [pnpm](https://pnpm.io) (the repo ships a `pnpm-lock.yaml`; `corepack enable` installs the pinned version).

## Project structure

```
*.html                 18 pages (index, about, institutions, experts, pricing, pledge, journal-guide, resources, article, contact, waitlist, apply, signin, privacy, terms, cookies, security, 404)
beta.html              forwards referral links (nelview.com/beta?ref=CODE) to the waitlist
src/styles/            site.css (base), pages.css, story.css, color.css (theme + motion + responsive layers)
src/scripts/           TypeScript sources, compiled by tsc to public/js/ as classic scripts
  site.ts              header, footer, menus, icons, forms (posts to Google Apps Script)
  i18n.ts              English / French toggle, auto-detected from browser + timezone
  motion.ts            scroll reveals, smooth scroll, page transitions (Motion + Lenis from CDN; currently switched off in every page)
  legal.ts             privacy / terms / cookies / security page content
  posts.ts             blog posts data
src/types/globals.d.ts shared window globals
src/demo/              embedded 38-second product demo (React, bundled by Vite to dist/demo/)
public/assets/         images, team photos, audio, self-hosted fonts
apps-script/           Google Apps Script backend (forms -> Google Sheet + emails)
```

## Configuration

- **Form endpoint**: `NV_EP` in `src/scripts/site.ts` is the deployed Apps Script web-app URL.
- **Portal links**: `PORTAL_BASE` at the top of `src/scripts/site.ts` (default `https://app.nelview.com`). Portal links in `apply.html` and `institutions.html` use the same domain.
- **Sign in / Get started**: both route to `signin.html` / `waitlist.html` during the private beta (`APP` in `site.ts`).

## Branches: preview and production

| Branch    | Purpose    | What happens on push                                                             |
| --------- | ---------- | -------------------------------------------------------------------------------- |
| `main`    | Production | Built and deployed as the live site.                                             |
| `preview` | Preview    | Built as a preview: same site, hidden from search engines (`noindex` + robots). |

Day to day: push work to `preview`, check it, then open a pull request from `preview` into `main` to release.

A build is a preview when `NELVIEW_ENV=preview`, on Vercel preview deployments, and on Netlify deploy previews / branch deploys. Everything else (including a local `pnpm run build`) is a production build.

## Deploy

Any static host works. Build command `pnpm run build`, output folder `dist`.

- **Vercel**: import the repo. `vercel.json` is included (clean URLs). `main` is the production branch; every push to `preview` gets its own preview URL automatically.
- **Netlify**: import the repo. `netlify.toml` is included. `main` is production; turn on branch deploys for `preview` under Site configuration → Build & deploy → Branches.
- **GitHub Pages**: Settings → Pages → Source: _GitHub Actions_. `.github/workflows/deploy.yml` deploys every push to `main`. Pages hosts one site per repository, so pushes to `preview` (and pull requests into `main`) are built and attached to the workflow run as the `site-preview` artifact rather than published at a URL.

Point `www.nelview.com` at the host. If the domain differs, set the `SITE_URL` environment variable for the build (used for canonical and share-card URLs) and update `public/sitemap.xml` and `public/robots.txt`.

## Backend (Google Apps Script)

`apps-script/Code.gs` receives every form (waitlist, newsletter, pledge alerts, expert applications, contact, demo requests), writes to Google Sheets, saves reviewer CVs to Google Drive and sends branded emails. See `apps-script/Google Sheet Setup.md`.

The site waits for the script's reply before confirming anything to the visitor, and shows an error they can retry from if it does not get one. After changing `Code.gs`, redeploy it or the live site keeps talking to the old version.

To update an existing deployment, paste `Code.gs` into the Apps Script editor, then **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Editing the existing deployment keeps the same URL. Or use [clasp](https://github.com/google/clasp): copy `.clasp.json.example` to `.clasp.json`, add your script ID, run `clasp push`.

## TypeScript notes

The scripts were ported from the original JavaScript and keep `// @ts-nocheck` at the top so the build is clean today. Remove it file by file and type against `src/types/globals.d.ts` to tighten checks. `pnpm run typecheck` runs the compiler without emitting.

## Before launch

- Replace placeholder reviewer names, match percentages and academic board.
- Replace stock photos with Nelview's own.
- Add real blog content (`src/scripts/posts.ts`).
- Legal review of privacy, terms, cookies.
