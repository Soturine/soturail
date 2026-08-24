# Migration to v1.5

v1.5 is a minor release with two environment/security changes that may require action.

## Required Node baseline

Node.js 20 is no longer supported. Install Node.js 22 or 24 LTS, then reinstall dependencies:

```bash
node --version
npm ci
npm run build
```

## MCP raw disclosure

Remove `allow_raw` from MCP tool calls and generated schemas. MCP raw expansion is always redacted. If an authorized human needs exact local output, use the existing CLI confirmation path outside MCP:

```bash
soturail expand <raw_id> --allow-raw --yes
```

The server uses the official SDK and modern protocol while preserving tested legacy negotiation. Re-export host configuration if the host cached an older tool schema.

## Artifact freshness

Evidence, knowledge, context, and run artifacts now carry workspace fingerprints and stronger metadata. Existing v1.4 artifacts remain readable where compatible, but they may be reported stale or may need regeneration:

```bash
soturail index
soturail knowledge update project-guide
soturail evidence collect
soturail self readiness --v1 --strict
```

There is no general in-place artifact migration engine in v1.5. Do not hand-edit schema versions to suppress freshness or compatibility checks.

## CI and native metadata

CI should test Node 22 and 24 and run the full dependency audit. The optional Rust crate now matches package version `1.5.0` and repository license `Apache-2.0`; TypeScript remains the required fallback.
