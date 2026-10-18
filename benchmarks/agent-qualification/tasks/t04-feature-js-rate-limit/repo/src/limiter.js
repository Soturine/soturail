function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer`);
}

export function createLimiter({ limit, windowMs, now = Date.now }) {
  assertPositiveInteger("limit", limit);
  assertPositiveInteger("windowMs", windowMs);
  const counters = new Map();

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
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    }
  };
}
