import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "app");
const PORT = 8080;

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const safePath = normalize(join(ROOT, rawPath === "/" ? "index.html" : rawPath));
  if (!safePath.startsWith(ROOT + sep) && safePath !== ROOT) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!existsSync(safePath) || !statSync(safePath).isFile()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(safePath)] || "application/octet-stream" });
  createReadStream(safePath).pipe(res);
});

server.listen(PORT, () => {
  console.log("Leonida Platinum Guide at http://localhost:" + PORT);
});
