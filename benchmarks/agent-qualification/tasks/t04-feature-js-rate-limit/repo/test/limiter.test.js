import test from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../src/limiter.js";

test("blocks after limit within a window and resets next window", () => {
  let t = 0;
  const limiter = createLimiter({ limit: 2, windowMs: 1000, now: () => t });
  assert.equal(limiter.tryAcquire("a"), true);
  assert.equal(limiter.tryAcquire("a"), true);
  assert.equal(limiter.tryAcquire("a"), false);
  t = 1000;
  assert.equal(limiter.tryAcquire("a"), true);
});

test("validates options", () => {
  assert.throws(() => createLimiter({ limit: 0, windowMs: 10 }), RangeError);
});
