import test from "node:test";
import assert from "node:assert/strict";
import { mergeConfig } from "../src/merge.js";

test("override wins for scalars", () => {
  assert.equal(mergeConfig({ a: 1 }, { a: 2 }).a, 2);
});

test("nested values are merged", () => {
  const merged = mergeConfig({ http: { timeoutMs: 1, keep: true } }, { http: { timeoutMs: 2 } });
  assert.deepEqual(merged, { http: { timeoutMs: 2, keep: true } });
});
