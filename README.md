# Nelview website

The ultimate pre-submission audit for research. Marketing site for Nelview, in English and French.

Static multi-page site built with **Vite + TypeScript**. No framework: each page is plain HTML, styled by shared CSS and driven by small TypeScript modules.

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
src/
  pages/            HTML pages. src/pages/about.html is served as /about.html
    demo/           the animated React demo (/demo/). No longer linked: the home page plays
                    the product video instead
  scripts/          TypeScript modules, bundled by Vite
    site.ts         header, footer, menus, icons, form submission
    i18n.ts         English / French switch, detected from browser and timezone
    motion.ts       scroll reveals, bar fills and count-ups (Motion)
    legal.ts        privacy / terms / cookies / security content
    posts.ts        blog posts
    pages/          one script per page that needs its own behaviour
  styles/           theme.css is the current design and loads last; site.css, pages.css,
                    story.css and color.css are the older layers it builds on
  demo/             React source of that animated demo
  types/            shared type declarations
public/             files copied to the site as they are: images, the product video, tool logos
                    (assets/logos), fonts, favicon set, robots.txt, sitemap.xml
tests/
  unit/             form backend (apps-script/Code.gs) run under Node
  e2e/              browser tests against the built site (Playwright)
apps-script/        Google Apps Script backend: forms -> Google Sheet, Drive and emails
docs/               notes that are not needed to run the project
.github/workflows/  build, test and deploy
vite.config.ts      build: pages, share-card tags, responsive images, preview builds
```

Each page lists the scripts it needs, in order: `site.ts`, `i18n.ts`, its own page script if it has one, then `motion.ts`.

## Tests

```bash
pnpm run typecheck
pnpm test             # backend unit tests, no browser needed
pnpm run build
pnpm run test:e2e     # browser tests against dist/
```

The first time, install the test browser with `pnpm exec playwright install chromium`. The browser tests never contact the real form backend; they answer its requests themselves.

## Configuration

- **Form endpoint**: `NV_EP` in `src/scripts/site.ts` is the deployed Apps Script web-app URL.
- **Portal links**: `PORTAL_BASE` at the top of `src/scripts/site.ts` (default `https://app.nelview.com`). Portal links in `src/pages/apply.html` and `src/pages/institutions.html` use the same domain.
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

`apps-script/Code.gs` receives every form (waitlist, newsletter, pledge alerts, expert applications, contact, demo requests), writes to Google Sheets, saves reviewer CVs to Google Drive and sends branded emails. See `apps-script/SETUP.md`.

The site waits for the script's reply before confirming anything to the visitor, and shows an error they can retry from if it does not get one. After changing `Code.gs`, redeploy it or the live site keeps talking to the old version.

To update an existing deployment, paste `Code.gs` into the Apps Script editor, then **Deploy → Manage deployments → Edit → Version: New version → Deploy**. Editing the existing deployment keeps the same URL. Or use [clasp](https://github.com/google/clasp): copy `.clasp.json.example` to `.clasp.json`, add your script ID, run `clasp push`.

## TypeScript notes

The scripts were ported from the original JavaScript and keep `// @ts-nocheck` at the top, so the type check passes today without checking much. Remove it file by file and type against `src/types/globals.d.ts` to tighten checks.

## Before launch

- Replace placeholder reviewer names, match percentages and academic board.
- Replace stock photos with Nelview's own.
- Add real blog content (`src/scripts/posts.ts`).
- Legal review of privacy, terms, cookies.
