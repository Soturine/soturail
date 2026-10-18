import test from "node:test";
import assert from "node:assert/strict";
import { formatBytes } from "../src/index.js";

test("small values stay in bytes", () => {
  assert.equal(formatBytes(512), "512 B");
});

test("decimals option", () => {
  assert.equal(formatBytes(1536, { decimals: 2 }), "1.50 KiB");
});

test("exact boundaries use the larger unit", () => {
  assert.equal(formatBytes(1024), "1.0 KiB");
  assert.equal(formatBytes(1024 * 1024), "1.0 MiB");
});
