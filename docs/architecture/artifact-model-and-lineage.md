# Artifact Model and Lineage

SotuRail artifacts are workspace-bound records, not anonymous cache files. The v1.5 storage foundation centralizes locations, atomic persistence, fingerprints, and lineage metadata while retaining readable local files as the source of truth.

## Components

- `ArtifactRegistry` resolves canonical paths below `.soturail/` for raw data, evidence, knowledge, contracts, manifests, receipts, capabilities, outcomes, migrations, and evaluations.
- `ArtifactStore` writes JSON through a same-directory temporary file, flushes it, and atomically renames it. JSONL readers expose and recover a truncated final record without accepting malformed middle records.
- `ArtifactEnvelope` identifies schema, artifact kind/id, producer/version, creation time, workspace fingerprint, freshness, dependencies, superseded artifacts, and payload digest.
- `WorkspaceFingerprint` combines repository identity, HEAD, dirty-state digest, lock/config digests, and toolchain facts. Secret values and raw file content are excluded.

## Freshness and lineage

An artifact is current only when its stored workspace fingerprint matches a freshly computed one. A one-byte tracked workspace change therefore makes prior evidence stale. `dependencies` records inputs and their digests; `supersedes` preserves replacement history. Stale is a visible state and must never be silently upgraded to verified.

Knowledge topic IDs include a source-derived hash so colliding slugs do not overwrite each other. Recompilation removes generated topics for renamed or deleted sources. Evidence records both its workspace binding and an envelope.

## Path and write invariants

- Caller-controlled paths pass through `WorkspaceGuard` before reads or writes.
- Canonical artifact paths come from `ArtifactRegistry`; `evals/` remains the single evaluation path.
- Critical JSON writes use `ArtifactStore` or the delegated atomic configuration writer.
- Raw logs have sensitivity, fingerprint, retention, status, inspection, and purge metadata.
- A cache or future SQLite/FTS index is reconstructible and never the only copy of truth.

## Recovery and migration

Atomic replacement prevents partially written JSON from becoming canonical. JSONL tail recovery makes an interrupted append diagnosable. A general N-1 migration engine is deliberately deferred to v1.6: it must support dry run, backup, schema validation, atomic replacement, and rollback before it can be marked implemented.

The schemas are versioned. Producers must reject incompatible envelopes instead of guessing, and migrations must preserve the previous artifact until validation succeeds.
