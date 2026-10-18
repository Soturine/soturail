import test from "node:test";
import assert from "node:assert/strict";
import { shippingFee } from "../src/shipping.js";

test("module exports shippingFee", () => {
  assert.equal(typeof shippingFee, "function");
});
