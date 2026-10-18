import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.js";
import { createUser } from "../src/handlers/create-user.js";
import { updateUser } from "../src/handlers/update-user.js";

test("create normalizes and stores", () => {
  const store = createStore();
  const res = createUser(store, { email: " Ana@Example.COM ", name: " Ana " });
  assert.equal(res.status, 201);
  assert.deepEqual(res.user, { id: 1, email: "ana@example.com", name: "Ana" });
});

test("update rejects invalid age", () => {
  const store = createStore();
  createUser(store, { email: "a@b.co", name: "Ana" });
  assert.equal(updateUser(store, 1, { age: 7 }).status, 422);
});
