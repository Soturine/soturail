import { promises as fs } from "node:fs";
import path from "node:path";

const TYPES = { ".html": "text/html", ".css": "text/css", ".txt": "text/plain" };

// Resolves a request path such as "/css/site.css" against the public root.
export async function serveStatic(publicRoot, requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const target = path.join(publicRoot, decoded);
  try {
    const body = await fs.readFile(target);
    return { status: 200, type: TYPES[path.extname(target)] ?? "application/octet-stream", body };
  } catch {
    return { status: 404, type: "text/plain", body: Buffer.from("not found") };
  }
}
