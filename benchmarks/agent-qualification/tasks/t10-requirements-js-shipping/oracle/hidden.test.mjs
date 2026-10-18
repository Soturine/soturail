import test from "node:test";
import assert from "node:assert/strict";
import { shippingFee } from "../src/shipping.js";

test("R1 domestic base", () => {
  assert.equal(shippingFee({ subtotal: 20, country: "ES", weightKg: 1 }), 4.9);
});
test("R2 domestic free from 50", () => {
  assert.equal(shippingFee({ subtotal: 50, country: "ES", weightKg: 1 }), 0);
  assert.equal(shippingFee({ subtotal: 49.99, country: "ES", weightKg: 1 }), 4.9);
});
test("R3 international by whole extra kg", () => {
  assert.equal(shippingFee({ subtotal: 10, country: "FR", weightKg: 1 }), 12);
  assert.equal(shippingFee({ subtotal: 10, country: "FR", weightKg: 2 }), 12);
  assert.equal(shippingFee({ subtotal: 10, country: "FR", weightKg: 4.7 }), 15);
  assert.equal(shippingFee({ subtotal: 999, country: "PT", weightKg: 3 }), 13.5);
});
test("R5 invalid weight", () => {
  assert.throws(() => shippingFee({ subtotal: 1, country: "ES", weightKg: -1 }), RangeError);
  assert.throws(() => shippingFee({ subtotal: 1, country: "ES", weightKg: "3" }), RangeError);
});
