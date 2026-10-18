import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { serveStatic } from "../src/static.js";

const root = path.resolve("public");
const leaks = (res) => res.status === 200 && res.body.toString().includes("API_TOKEN");

const attacks = [
  "/../secret.env",
  "/..%2fsecret.env",
  "/%2e%2e/secret.env",
  "/css/../../secret.env",
  "/..\\secret.env",
  "/%2e%2e%5csecret.env",
  "/" + path.resolve("secret.env").replace(/\\/g, "/"),
  "/" + path.resolve("secret.env")
];

for (const attack of attacks) {
  test(`blocks ${attack}`, async () => {
    const res = await serveStatic(root, attack);
    assert.equal(leaks(res), false, `leaked via ${attack}`);
    assert.notEqual(res.status, 200);
  });
}

test("malformed escapes do not crash", async () => {
  const res = await serveStatic(root, "/%E0%A4%A");
  assert.notEqual(res.status, 200);
});
test("legitimate files still served", async () => {
  assert.equal((await serveStatic(root, "/index.html")).status, 200);
  assert.equal((await serveStatic(root, "/css/site.css")).status, 200);
  assert.equal((await serveStatic(root, "/css/site.css?v=3")).status, 200);
  assert.equal((await serveStatic(root, "/notes..v2.txt")).status, 200);
});
test("in-root dot segments are fine", async () => {
  assert.equal((await serveStatic(root, "/css/../index.html")).status, 200);
});
