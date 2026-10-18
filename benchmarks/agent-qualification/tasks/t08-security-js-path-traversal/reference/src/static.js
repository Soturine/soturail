import { promises as fs } from "node:fs";
import path from "node:path";

const TYPES = { ".html": "text/html", ".css": "text/css", ".txt": "text/plain" };
const NOT_FOUND = () => ({ status: 404, type: "text/plain", body: Buffer.from("not found") });

export async function serveStatic(publicRoot, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath.split("?")[0]);
  } catch {
    return { status: 400, type: "text/plain", body: Buffer.from("bad request") };
  }
  if (decoded.includes("\0")) return NOT_FOUND();
  const root = await fs.realpath(publicRoot);
  const target = path.resolve(root, "." + path.posix.sep + decoded.replace(/\\/g, "/"));
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return NOT_FOUND();
  try {
    const real = await fs.realpath(target);
    const realRelative = path.relative(root, real);
    if (realRelative.startsWith("..") || path.isAbsolute(realRelative)) return NOT_FOUND();
    const body = await fs.readFile(real);
    return { status: 200, type: TYPES[path.extname(real)] ?? "application/octet-stream", body };
  } catch {
    return NOT_FOUND();
  }
}
