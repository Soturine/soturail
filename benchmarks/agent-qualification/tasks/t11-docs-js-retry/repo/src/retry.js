const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls fn until it resolves. Retries up to `retries` times after the first call
 * (so at most retries + 1 calls), waiting baseDelayMs * factor ** n before retry n (n from 0).
 * If `shouldRetry(error)` returns false the error is rethrown immediately.
 * When every call fails, throws an AggregateError whose `errors` holds every failure in order.
 */
export async function retry(fn, { retries = 3, baseDelayMs = 200, factor = 2, shouldRetry = () => true } = {}) {
  const errors = [];
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      errors.push(error);
      if (!shouldRetry(error) || attempt === retries) break;
      await sleep(baseDelayMs * factor ** attempt);
    }
  }
  if (errors.length <= retries && !shouldRetry(errors.at(-1))) throw errors.at(-1);
  throw new AggregateError(errors, `retry: ${errors.length} attempt(s) failed`);
}
