import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.js";
import { createUser } from "../src/handlers/create-user.js";
import { updateUser } from "../src/handlers/update-user.js";

// Characterization of the pre-refactor behavior (verified against the original handlers).
const cases = [
  [{ email: "x@y.io", name: "Al" }, { status: 201, user: { id: 1, email: "x@y.io", name: "Al" } }],
  [{ email: "bad", name: "Al" }, { status: 422, errors: ["email: invalid"] }],
  [{ email: 5, name: "A" }, { status: 422, errors: ["email: invalid", "name: must be 2-80 characters"] }],
  [{ email: "x@y.io", name: "Al", age: 13 }, { status: 201, user: { id: 1, email: "x@y.io", name: "Al", age: 13 } }],
  [{ email: "x@y.io", name: "Al", age: 131 }, { status: 422, errors: ["age: must be an integer between 13 and 130"] }],
  [{ email: "x@y.io", name: "Al", age: 20.5 }, { status: 422, errors: ["age: must be an integer between 13 and 130"] }],
  [{ email: "x@y.io", name: "A".repeat(81) }, { status: 422, errors: ["name: must be 2-80 characters"] }],
  [{ name: "Al" }, { status: 422, errors: ["email: invalid"] }]
];

for (const [input, expected] of cases) {
  test(`create ${JSON.stringify(input).slice(0, 60)}`, () => {
    assert.deepEqual(createUser(createStore(), input), expected);
  });
}

function seeded() {
  const store = createStore();
  createUser(store, { email: "a@b.co", name: "Ana", age: 30 });
  return store;
}

test("update partial name keeps other fields", () => {
  assert.deepEqual(updateUser(seeded(), 1, { name: "  Bea " }), { status: 200, user: { id: 1, email: "a@b.co", name: "Bea", age: 30 } });
});
test("update email normalizes", () => {
  assert.equal(updateUser(seeded(), 1, { email: " NEW@X.IO" }).user.email, "new@x.io");
});
test("update with empty patch is a no-op success", () => {
  assert.deepEqual(updateUser(seeded(), 1, {}), { status: 200, user: { id: 1, email: "a@b.co", name: "Ana", age: 30 } });
});
test("update collects errors in field order", () => {
  assert.deepEqual(updateUser(seeded(), 1, { age: 200, email: "nope", name: "" }), { status: 422, errors: ["email: invalid", "name: must be 2-80 characters", "age: must be an integer between 13 and 130"] });
});
test("failed update does not persist", () => {
  const store = seeded();
  updateUser(store, 1, { name: "Z" });
  assert.equal(store.get(1).name, "Ana");
});
test("update missing user", () => {
  assert.deepEqual(updateUser(createStore(), 9, { name: "Al" }), { status: 404, errors: ["user: not found"] });
});
