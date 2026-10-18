const BULK_THRESHOLD = 10;
const BULK_RATE = 0.1;

export function lineTotal(line) {
  const gross = line.unitPrice * line.quantity;
  if (line.noDiscount) return gross;
  if (line.quantity > BULK_THRESHOLD) {
    return gross * (1 - BULK_RATE);
  }
  return gross;
}

export function orderTotal(lines) {
  const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  return Math.round(sum * 100) / 100;
}
