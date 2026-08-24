# Context Architecture

SotuRail selects the smallest sufficient, workspace-bound context before escalating. Context is an artifact with a budget and provenance, not an unbounded prompt dump.

## Context escalation ladder

1. Stable project rules and the current Change Contract.
2. Repository index and query-matched ranges.
3. Source-backed knowledge and current evidence.
4. Structural or dependency documentation providers when available.
5. Broader files or raw recovery only when the previous level is insufficient and policy permits it.

The ladder preserves discovery/trust separation: finding a source does not make it authoritative, and provider output remains attributed.

## Shared Context Artifact

The v1.5 context pack records target host, workspace fingerprint, selected files, reasons, byte/token estimates, budget, and overflow/degradation state. The hard byte budget is enforced during selection; an over-budget result is explicit rather than silently truncated. Stable content is ordered before dynamic timestamps, run IDs, and recent output to improve provider cache alignment.

## Provider boundaries

- `StructuralProvider` will supply symbol identity, impact, freshness, and graph health. v1.5 retains the heuristic index and provider contract direction; semantic graph adapters are deferred.
- `DependencyDocsProvider` will retrieve version-matched official dependency documentation. It must preserve source/version provenance and cannot promote web text to project truth.
- `ContextTransformProvider` may perform lossless or policy-approved compression. Transformations must declare `LOSSLESS_ONLY`, `COMPRESSIBLE`, or `SEMANTIC_OPTIONAL`, record savings, and preserve recovery pointers.

Optional vector retrieval may enrich candidate ranking later. It cannot become a required source of truth, bypass the hard budget, or replace deterministic repository and artifact checks.

## Freshness

Every shared artifact is tied to a workspace fingerprint. Consumers compare that binding before reuse. Stale context may be shown as stale for diagnosis, but it cannot satisfy readiness evidence without regeneration or explicit re-attestation.
