import test from "node:test";
import assert from "node:assert/strict";
import { createLimiter } from "../src/limiter.js";

test("override replaces default limit only for that key", () => {
  const limiter = createLimiter({ limit: 1, windowMs: 1000, now: () => 0, overrides: { vip: 3 } });
  assert.equal(limiter.tryAcquire("vip"), true);
  assert.equal(limiter.tryAcquire("vip"), true);
  assert.equal(limiter.tryAcquire("vip"), true);
  assert.equal(limiter.tryAcquire("vip"), false);
  assert.equal(limiter.tryAcquire("other"), true);
  assert.equal(limiter.tryAcquire("other"), false);
});
test("override may be lower than default", () => {
  const limiter = createLimiter({ limit: 5, windowMs: 1000, now: () => 0, overrides: { bot: 1 } });
  assert.equal(limiter.tryAcquire("bot"), true);
  assert.equal(limiter.tryAcquire("bot"), false);
});
test("remaining reflects usage, override and window reset", () => {
  let t = 0;
  const limiter = createLimiter({ limit: 2, windowMs: 1000, now: () => t, overrides: { vip: 4 } });
  assert.equal(limiter.remaining("new"), 2);
  assert.equal(limiter.remaining("vip"), 4);
  limiter.tryAcquire("vip");
  assert.equal(limiter.remaining("vip"), 3);
  limiter.tryAcquire("a"); limiter.tryAcquire("a"); limiter.tryAcquire("a");
  assert.equal(limiter.remaining("a"), 0);
  t = 2500;
  assert.equal(limiter.remaining("a"), 2);
});
test("remaining does not consume budget", () => {
  const limiter = createLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
  limiter.remaining("x"); limiter.remaining("x");
  assert.equal(limiter.tryAcquire("x"), true);
});
test("existing behavior and validation preserved", () => {
  assert.throws(() => createLimiter({ limit: 1, windowMs: 0 }), RangeError);
  const limiter = createLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
  assert.equal(limiter.tryAcquire("a"), true);
  assert.equal(limiter.tryAcquire("a"), false);
});
