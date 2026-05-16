// Local CSP-enforcing static server for testing dist/ under stage's exact CSP.
// Usage: node scripts/csp-preview.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve("dist");
const port = Number(process.argv[2] || 4322);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".mjs":  "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".ico":  "image/x-icon",
  ".xml":  "application/xml; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
  ".json": "application/json",
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    let full = join(root, p);
    try {
      const s = await stat(full);
      if (s.isDirectory()) full = join(full, "index.html");
    } catch {
      if (!extname(full)) full = join(root, p, "index.html");
    }
    const body = await readFile(full);
    res.writeHead(200, {
      "Content-Type": MIME[extname(full)] || "application/octet-stream",
      "Content-Security-Policy": CSP,
    });
    res.end(body);
  } catch (e) {
    res.writeHead(404, { "Content-Type": "text/plain", "Content-Security-Policy": CSP });
    res.end("404");
  }
}).listen(port, () => console.log(`csp-preview on http://localhost:${port}`));
