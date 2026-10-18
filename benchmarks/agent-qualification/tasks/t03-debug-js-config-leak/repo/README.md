# tenant-gateway

Resolves per-tenant HTTP client settings.

`mergeConfig(base, override)` returns a new object: nested plain objects are merged recursively, arrays and scalars from `override` replace the base value, and neither input is modified.
