function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function mergeConfig(base, override = {}) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = Object.assign(result[key], mergeConfig(result[key], value));
    } else {
      result[key] = value;
    }
  }
  return result;
}
