# SotuRail v1.5.0 — Verified Control Plane Foundation

v1.5 turns SotuRail's context rails into a workspace-bound engineering control plane. It hardens filesystem and raw-log boundaries, makes artifact lineage/freshness explicit, modernizes MCP, and ships deterministic governance, contract, readiness, and execution-envelope foundations.

## Highlights

- Canonical WorkspaceGuard, Artifact Registry/Store/Envelope, and Workspace Fingerprint.
- Capability Registry/Epochs, Run Manifest, Change Contract, NativeMinimal governance, Dual Gate, and exact-digest Execution Envelope.
- Hard-budget shared context artifacts and workspace-bound evidence/knowledge freshness.
- Official typed MCP SDK with modern protocol and legacy negotiation smoke coverage.
- Node 22/24 baseline, CodeQL, full audit, CycloneDX SBOM, checksums, release manifest, and build/SBOM attestations.

## Security fixes

- Closed caller-controlled MCP raw-log authorization; MCP disclosure is always redacted.
- Rejected traversal, absolute-path escape, symlink escape, sensitive paths, and Windows boundary edges through WorkspaceGuard.
- Added raw sensitivity, content fingerprint, retention, inspection, doctor, and purge lifecycle metadata.
- Added architecture drift checks for raw bypasses, MCP mapping, workspace guards, atomic stores, runtime baseline, and native metadata.

## Integrity and evidence

Critical JSON persistence is atomic and JSONL tail interruption is recoverable. Knowledge topics use source-derived IDs and remove residue after rename/delete. Evidence records a workspace fingerprint and becomes stale after workspace changes rather than silently retaining verified status.

## Governance and contracts

The offline `NativeMinimal` provider validates known capabilities and required approvals. Authority and readiness are independent gates and both must pass. Execution is attested only when its payload digest equals the evaluated digest. AGT/ACS is a tested fail-closed adapter boundary, not an advertised integration.

## MCP compatibility

The modern server uses the official v2 SDK and stable `2026-07-28` protocol path. Legacy negotiation remains covered for existing hosts. Tool schemas are strict and tools map to canonical capability IDs. Arbitrary shell is not exposed.

## Documentation and roadmap

New current-state documents cover the verified control plane, artifacts/lineage, governance, context, contracts/verification, providers, threat model, benchmarking, v1.5 commands, and migration. The roadmap is now dependency-ordered and the master implementation tracker retains honest partial/deferred states.

## Migration and deprecation

- Node.js 20 support is removed; use Node 22 or 24.
- MCP callers must remove `allow_raw`; exact disclosure is local CLI-only.
- Regenerate old artifacts when freshness/schema checks report them stale.

See [Migration to v1.5](../getting-started/migration-v1.5.md).

## Compatibility

The existing CLI rails and TypeScript fallback remain. Modern and legacy MCP negotiation are tested. The optional native crate remains optional and now shares release/license metadata with the npm package.

## Known limitations

- The architecture report retains four non-blocking boundary warnings for large legacy commands/core-to-command imports.
- SotuRail is not a sandbox; host and OS enforcement remain external.
- Provider results and generated artifacts are not automatically human-approved or runtime-verified.
- General schema migration/rollback and evidence receipts are not present in v1.5.

## Deliberately deferred

AGT/ACS live integration, SQLite/FTS index, structural graph adapters, Decision Graph, full evidence receipts, temporal/outcome brain, vector backend, runtime orchestration/Conductor, Tauri UI, integration broker, and media/browser providers.

## Verification

```bash
npm run build
npm run typecheck
npm test
npm run docs:check
npm audit
node dist/cli.js mcp smoke
node dist/cli.js self architecture --check
cargo test --manifest-path native/soturail-native/Cargo.toml
npm run release:check
npm run release:artifacts
```
