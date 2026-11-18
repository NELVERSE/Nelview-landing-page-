import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test, expect } from "./fixtures";

// Every file the built site refers to has to exist in dist/: pictures, scripts,
// styles, fonts and the pages themselves. A moved or renamed file that a page
// still points at shows up here instead of as a broken picture.
const dist = fileURLToPath(new URL("../../dist", import.meta.url));

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const local = (ref: string) =>
  ref && !/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/.test(ref.trim());

test("every local file the site refers to exists", async () => {
  const missing: string[] = [];
  for (const file of walk(dist)) {
    const source = readFileSync(file, "utf8");
    const refs = new Set<string>();
    if (file.endsWith(".html")) {
      for (const m of source.matchAll(/\b(?:src|poster|href)=["']([^"'#?]+\.[a-z0-9]{2,5})(?:[#?][^"']*)?["']/gi)) refs.add(m[1]);
      for (const m of source.matchAll(/\bsrcset=["']([^"']+)["']/gi)) m[1].split(",").forEach((p) => refs.add(p.trim().split(/\s+/)[0]));
    } else if (file.endsWith(".css")) {
      for (const m of source.matchAll(/url\(\s*["']?([^"')]+?)["']?\s*\)/g)) refs.add(m[1].split(/[#?]/)[0]);
    } else continue;
    for (const ref of refs) {
      if (!local(ref) || !/\.[a-z0-9]{2,5}$/i.test(ref)) continue;
      const target = ref.startsWith("/") ? join(dist, ref) : resolve(dirname(file), ref);
      if (!existsSync(target)) missing.push(`${file.replace(dist, "")} -> ${ref}`);
    }
  }
  expect(missing, "files referred to but not built").toEqual([]);
});

test("the shipped assets are grouped by purpose", async () => {
  const folders = readdirSync(join(dist, "assets"));
  for (const folder of ["fonts", "logos", "media", "photos", "product"]) expect(folders, folder).toContain(folder);
  // The old folder names are gone.
  for (const old of ["gen", "story", "web", "pledge", "mockups", "team", "audio"]) expect(folders, old).not.toContain(old);
});
