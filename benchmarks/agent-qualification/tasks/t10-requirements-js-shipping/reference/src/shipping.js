const round = (value) => Math.round(value * 100) / 100;

export function shippingFee({ subtotal, country, weightKg, express = false }) {
  if (typeof weightKg !== "number" || Number.isNaN(weightKg) || weightKg < 0) throw new RangeError("weightKg must be a non-negative number");
  if (express) throw new Error("express pricing unresolved: R4 contradicts itself, see OPEN_QUESTIONS.md");
  if (country === "ES") return subtotal >= 50 ? 0 : 4.9;
  return round(12 + 1.5 * Math.max(0, Math.floor(weightKg) - 2));
}
