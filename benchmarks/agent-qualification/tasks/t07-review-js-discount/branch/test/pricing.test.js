import test from "node:test";
import assert from "node:assert/strict";
import { orderTotal } from "../src/pricing.js";

test("sums lines", () => {
  assert.equal(orderTotal([{ unitPrice: 2.5, quantity: 2 }, { unitPrice: 1, quantity: 1 }]), 6);
});

test("bulk discount for large quantities", () => {
  assert.equal(orderTotal([{ unitPrice: 1, quantity: 20 }]), 18);
});

test("noDiscount lines are never discounted", () => {
  assert.equal(orderTotal([{ unitPrice: 1, quantity: 20, noDiscount: true }]), 20);
});
