export function lineTotal(line) {
  return line.unitPrice * line.quantity;
}

export function orderTotal(lines) {
  const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  return Math.round(sum * 100) / 100;
}
