import type { HtmlTagDescriptor, Plugin } from "vite";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SITE_URL, isPreview, outDir, sitePath } from "../paths";

/** Canonical and share-card tags on every page; noindex on previews. */
export function seoMeta(): Plugin {
  // Never indexed, on any build: error page, referral redirect, embedded demo.
  const neverIndexed = new Set(["/404.html", "/beta.html", "/demo/index.html"]);
  // One file serves many URLs (article.html?p=...), so it sets its own canonical.
  const noCanonical = new Set(["/article.html"]);

  return {
    name: "nelview-seo-meta",
    apply: "build",
    transformIndexHtml(html, ctx) {
      const path = sitePath(ctx.path);
      const tags: HtmlTagDescriptor[] = [];
      const meta = (attrs: Record<string, string>) =>
        tags.push({ tag: "meta", attrs, injectTo: "head" });

      if (isPreview || neverIndexed.has(path)) {
        if (!/<meta[^>]+name=["']robots["']/i.test(html))
          meta({ name: "robots", content: "noindex, nofollow" });
      }
      if (neverIndexed.has(path)) return tags;

      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim();
      const description = html
        .match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
        .match(/content="([^"]*)"/i)?.[1];
      const page = path.replace(/^\//, "").replace(/\.html$/, "");
      const url = `${SITE_URL}/${page === "index" ? "" : page}`;

      if (!noCanonical.has(path)) {
        tags.push({
          tag: "link",
          attrs: { rel: "canonical", href: url },
          injectTo: "head",
        });
        meta({ property: "og:url", content: url });
      }
      meta({ property: "og:type", content: "website" });
      meta({ property: "og:site_name", content: "Nelview" });
      if (title) meta({ property: "og:title", content: title });
      if (description)
        meta({ property: "og:description", content: description });
      meta({ property: "og:image", content: `${SITE_URL}/og-image.png` });
      meta({ property: "og:image:width", content: "1200" });
      meta({ property: "og:image:height", content: "630" });
      meta({
        property: "og:image:alt",
        content: "Nelview: the pre-submission audit for research",
      });
      meta({ name: "twitter:card", content: "summary_large_image" });
      meta({ name: "twitter:image", content: `${SITE_URL}/og-image.png` });

      // On the home page, tell search engines the site's name and logo, so a
      // result shows "Nelview" and the mark rather than the bare domain.
      if (path === "/index.html")
        tags.push({
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Nelview",
              alternateName: ["Nelview AI", "nelview.com"],
              url: `${SITE_URL}/`,
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Nelview",
              url: `${SITE_URL}/`,
              logo: `${SITE_URL}/icon-512.png`,
              email: "team@nelview.com",
              sameAs: ["https://www.linkedin.com/showcase/nelview/"],
            },
          ]),
          injectTo: "head",
        });
      return tags;
    },
    closeBundle() {
      if (!isPreview) return;
      writeFileSync(
        resolve(outDir, "robots.txt"),
        "# Preview build: keep out of search engines.\nUser-agent: *\nDisallow: /\n",
      );
    },
  };
}
