import test from "node:test";
import assert from "node:assert/strict";
import { mergeConfig } from "../src/merge.js";
import { configFor } from "../src/tenants.js";
import { DEFAULTS } from "../src/defaults.js";

const snapshot = JSON.stringify(DEFAULTS);

test("tenant settings do not leak across calls", () => {
  configFor("acme");
  const initech = configFor("initech");
  assert.equal(initech.http.timeoutMs, 5000);
  assert.equal(initech.http.retry.attempts, 2);
  configFor("globex");
  assert.equal(configFor("initech").headers["x-tenant"], undefined);
});
test("defaults remain unmodified", () => {
  configFor("acme"); configFor("globex");
  assert.equal(JSON.stringify(DEFAULTS), snapshot);
});
test("deep merge keeps sibling nested keys", () => {
  const acme = configFor("acme");
  assert.equal(acme.http.retry.backoffMs, 100);
  assert.equal(acme.http.retry.attempts, 5);
});
test("inputs are never mutated", () => {
  const base = { a: { b: { c: 1 } }, list: [1] };
  const over = { a: { b: { d: 2 } } };
  const merged = mergeConfig(base, over);
  assert.deepEqual(base, { a: { b: { c: 1 } }, list: [1] });
  assert.deepEqual(over, { a: { b: { d: 2 } } });
  assert.deepEqual(merged, { a: { b: { c: 1, d: 2 } }, list: [1] });
});
test("arrays are replaced, not merged", () => {
  assert.deepEqual(mergeConfig({ r: ["eu", "us"] }, { r: ["br"] }).r, ["br"]);
});
