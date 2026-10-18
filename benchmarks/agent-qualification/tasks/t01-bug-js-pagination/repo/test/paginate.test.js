import test from "node:test";
import assert from "node:assert/strict";
import { paginate } from "../src/paginate.js";

test("first page of an evenly divisible list", () => {
  const result = paginate([1, 2, 3, 4], 1, 2);
  assert.deepEqual(result.items, [1, 2]);
  assert.equal(result.totalPages, 2);
});

test("rejects a non-positive page size", () => {
  assert.throws(() => paginate([1], 1, 0), RangeError);
});
