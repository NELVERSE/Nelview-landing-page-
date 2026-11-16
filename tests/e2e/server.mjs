// Serves dist/ the way the real hosts do: clean URLs (/about -> about.html)
// and 404.html, with a 404 status, for anything that does not exist.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(fileURLToPath(new URL("../../dist", import.meta.url)));
const port = Number(process.env.PORT) || 4174;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".m4v": "video/mp4",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const isFile = (path) => existsSync(path) && statSync(path).isFile();

if (!isFile(join(dist, "index.html"))) {
  console.error("dist/ is missing. Run `pnpm run build` first.");
  process.exit(1);
}

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = join(dist, path);
  let status = 200;
  if (!file.startsWith(dist) || !isFile(file)) {
    if (file.startsWith(dist) && isFile(`${file}.html`)) file += ".html";
    else [file, status] = [join(dist, "404.html"), 404];
  }
  res.writeHead(status, {
    "content-type": types[extname(file)] || "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving dist on http://localhost:${port}`));
