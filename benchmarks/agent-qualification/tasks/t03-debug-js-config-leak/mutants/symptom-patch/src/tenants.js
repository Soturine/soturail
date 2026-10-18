import { DEFAULTS } from "./defaults.js";
import { mergeConfig } from "./merge.js";

const TENANT_OVERRIDES = {
  acme: { http: { timeoutMs: 30000, retry: { attempts: 5 } } },
  globex: { headers: { "x-tenant": "globex" } },
  initech: {}
};

export function configFor(tenant) {
  return mergeConfig(structuredClone(DEFAULTS), TENANT_OVERRIDES[tenant] ?? {});
}
