export const DEFAULTS = {
  http: { timeoutMs: 5000, retry: { attempts: 2, backoffMs: 100 } },
  headers: { "user-agent": "tenant-gateway/2" },
  allowedRegions: ["eu", "us"]
};
