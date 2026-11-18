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
src/                          what the browser runs (the Vite root)
  pages/                      HTML pages. src/pages/about.html is served as /about
                              (files starting with _ are development-only)
    demo/                     the animated React demo (/demo/), no longer linked
  scripts/
    site.ts                   entry on every page: runs the shell below
    shell/                    the page shell, one concern per file
      config.ts               portal addresses and the form endpoint
      icons.ts                the Nelview mark and the icon set
      menu.ts                 what is in the header menus
      header.ts               the bar, mega-menus, phone menu, colour-hero behaviour
      footer.ts               footer and social links
      widgets.ts              inline icons, FAQ toggles, score rings, tabs
      forms.ts                sending to the backend, success and failure states
      ready.ts, consent.ts    loading skeleton, privacy banner
    i18n.ts                   entry for the English / French switch
    i18n/                     engine.ts (the switch), fr.ts and fr-html.ts (the French text)
    motion.ts                 scroll reveals, bar fills and count-ups (Motion)
    content/                  text that is data: posts.ts (blog), legal.ts (privacy, terms...)
    pages/                    one script per page that needs its own behaviour
  styles/
    main.css                  the one stylesheet every page loads; imports the layers in order
    base.css, pages.css,      four layers that build on each other (see main.css);
    palette.css, theme.css    theme.css is the current design and goes last
  demo/                       React source of the demo
  types/                      shared type declarations
public/                       copied to the site as they are
  assets/
    photos/                   photographs and photo-based images (colour washes baked in)
    product/                  product pictures: rendered screens (WebP, GIF) and the dashboard
    media/                    the product video, its poster, the demo's phone frame and music
    logos/                    tool logos shown on the home page
    fonts/                    web fonts and their licences
  favicon and app icons, og-image.png, robots.txt, sitemap.xml
build/                        the Vite build, in pieces: paths.ts, plugins/ (page routing,
                              share-card tags, responsive images)
tools/                        scripts run by hand: render-mockups.mjs, render-duotone.mjs
tests/
  unit/                       form backend (apps-script/Code.gs) run under Node
  e2e/                        browser tests against the built site (Playwright)
apps-script/                  Google Apps Script backend: forms -> Sheet, Drive and emails
docs/                         notes not needed to run the project (docs/archive: unused files)
.github/workflows/            build and test checks
vite.config.ts                wires build/ together
```

Each page loads `main.css`, then the scripts it needs, in order: `site.ts`, `i18n.ts`, its own page script if it has one, then `motion.ts`.

**Adding a page:** create `src/pages/name.html` (copy a similar page), add it to the menus in `src/scripts/shell/menu.ts` if it belongs there, add its French text to `src/scripts/i18n/fr.ts`, and add it to `public/sitemap.xml`.

**Adding a picture:** put it in the matching `public/assets/` folder and refer to it as `assets/<folder>/<file>` (pages are all at the site root). Large pictures get responsive WebP versions at build time. `pnpm test:e2e` includes a check that every file a page refers to exists.

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

## Product pictures

The product screens on the home, institutions and experts pages are images
(`public/assets/product`): a WebP for still screens, a GIF where bars fill in,
each with a French version that `i18n.ts` swaps in. The live version of each
screen is `src/pages/_mockups.html` (development only, never built). After
changing its text or layout, run `pnpm run mockups` (needs ImageMagick) and put
the new sizes from `tools/mockup-sizes.json` into the `<img>` tags. The
program-criteria preview on the institutions page and the earnings calculator
on the experts page stay live because visitors interact with them.

## Branches: preview and production

| Branch    | Purpose    | What happens on push                                                             |
| --------- | ---------- | -------------------------------------------------------------------------------- |
| `main`    | Production | The host (Vercel) builds and serves it as the live site.                         |
| `preview` | Preview    | Built as a preview: same site, hidden from search engines (`noindex` + robots). |

Day to day: push work to `preview`, check it, then open a pull request from `preview` into `main` to release.

A build is a preview when `NELVIEW_ENV=preview`, on Vercel preview deployments, and on Netlify deploy previews / branch deploys. Everything else (including a local `pnpm run build`) is a production build.

## Deploy

Any static host works. Build command `pnpm run build`, output folder `dist`.

- **Vercel**: import the repo. `vercel.json` is included (clean URLs). `main` is the production branch; every push to `preview` gets its own preview URL automatically.
- **Netlify**: import the repo. `netlify.toml` is included. `main` is production; turn on branch deploys for `preview` under Site configuration → Build & deploy → Branches.
- **CI**: `.github/workflows/deploy.yml` does not deploy. It typechecks, runs the unit and browser tests and builds on every push to `main` and `preview` and on pull requests into `main`, and attaches the built site to the run as an artifact (`site-production` or `site-preview`). Hosting deploys from the branches on its own.

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
- Add real blog content (`src/scripts/content/posts.ts`).
- Legal review of privacy, terms, cookies.
