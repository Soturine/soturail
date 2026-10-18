import http from "node:http";
import path from "node:path";
import { serveStatic } from "./static.js";

const root = path.resolve("public");

export function createServer() {
  return http.createServer(async (req, res) => {
    const result = await serveStatic(root, req.url ?? "/");
    res.writeHead(result.status, { "content-type": result.type });
    res.end(result.body);
  });
}
