import test from "node:test";
import assert from "node:assert/strict";
import { paginate } from "../src/paginate.js";
import { search } from "../src/search.js";

const ten = Array.from({ length: 10 }, (_, i) => i + 1);

test("partial last page is reachable", () => {
  const r = paginate(ten, 4, 3);
  assert.deepEqual(r.items, [10]);
  assert.equal(r.totalPages, 4);
});
test("exact multiple keeps page count", () => {
  assert.equal(paginate(ten, 1, 5).totalPages, 2);
  assert.deepEqual(paginate(ten, 3, 5).items, []);
});
test("empty list has zero pages and does not throw", () => {
  const r = paginate([], 1, 10);
  assert.equal(r.totalPages, 0);
  assert.deepEqual(r.items, []);
});
test("fewer items than one page", () => {
  const r = paginate([1, 2], 1, 10);
  assert.equal(r.totalPages, 1);
  assert.deepEqual(r.items, [1, 2]);
});
test("out-of-range pages return empty items", () => {
  assert.deepEqual(paginate(ten, 0, 3).items, []);
  assert.deepEqual(paginate(ten, 5, 3).items, []);
});
test("pageSize validation preserved", () => {
  assert.throws(() => paginate(ten, 1, 2.5), RangeError);
  assert.throws(() => paginate(ten, 1, -1), RangeError);
});
test("search exposes the last partial page", () => {
  const catalog = Array.from({ length: 7 }, (_, i) => ({ name: `Widget ${i}` }));
  const r = search(catalog, "widget", { page: 2, pageSize: 5 });
  assert.equal(r.items.length, 2);
  assert.equal(r.totalPages, 2);
});
