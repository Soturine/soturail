function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
}

export function createLimiter({ limit, windowMs, now = Date.now, overrides = {} }) {
  assertPositiveInteger("limit", limit);
  assertPositiveInteger("windowMs", windowMs);
  for (const [key, value] of Object.entries(overrides)) assertPositiveInteger(`overrides.${key}`, value);
  const counters = new Map();
  const limitFor = (key) => (Object.hasOwn(overrides, key) ? overrides[key] : limit);

  function bucket(key) {
    const windowStart = Math.floor(now() / windowMs) * windowMs;
    const current = counters.get(key);
    if (!current || current.windowStart !== windowStart) {
      const fresh = { windowStart, count: 0 };
      counters.set(key, fresh);
      return fresh;
    }
    return current;
  }

  return {
    tryAcquire(key) {
      const entry = bucket(key);
      if (entry.count >= limitFor(key)) return false;
      entry.count += 1;
      return true;
    },
    remaining(key) {
      return limitFor(key) - bucket(key).count;
    }
  };
}
