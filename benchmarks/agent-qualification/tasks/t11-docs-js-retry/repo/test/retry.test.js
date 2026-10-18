import test from "node:test";
import assert from "node:assert/strict";
import { retry } from "../src/retry.js";

test("returns first success", async () => {
  let calls = 0;
  const value = await retry(async () => { calls += 1; if (calls < 2) throw new Error("x"); return 7; }, { baseDelayMs: 1 });
  assert.equal(value, 7);
  assert.equal(calls, 2);
});
