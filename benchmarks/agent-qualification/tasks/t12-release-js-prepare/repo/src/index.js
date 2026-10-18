export { VERSION } from "./version.js";

const UNITS = ["B", "KiB", "MiB", "GiB", "TiB"];

export function formatBytes(bytes, { decimals = 1 } = {}) {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError("bytes must be a non-negative finite number");
  let value = bytes;
  let unit = 0;
  while (value > 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${value} B` : `${value.toFixed(decimals)} ${UNITS[unit]}`;
}
