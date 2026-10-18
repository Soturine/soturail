import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { serveStatic } from "../src/static.js";

const root = path.resolve("public");

test("serves a nested file", async () => {
  const res = await serveStatic(root, "/css/site.css");
  assert.equal(res.status, 200);
  assert.equal(res.type, "text/css");
});

test("missing file is 404", async () => {
  assert.equal((await serveStatic(root, "/nope.txt")).status, 404);
});
