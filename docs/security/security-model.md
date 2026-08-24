# Security Model

SotuRail reduces accidental damage and makes engineering decisions inspectable. It is not a sandbox and does not make untrusted commands safe.

## Filesystem and artifacts

Caller-controlled paths are resolved by `WorkspaceGuard`, including canonical and real-path containment checks for traversal, absolute paths, symlinks, Windows path edges, raw state, secrets, and VCS internals. Critical artifacts use the canonical `ArtifactRegistry` and atomic `ArtifactStore` path. Workspace fingerprints make stale evidence visible.

## Commands and side effects

Destructive commands remain denied or confirmation-gated by the local runner. External side effects also require the Dual Gate: the actor must have authority and the engineering state must be ready. An Execution Envelope binds approval to the exact payload digest; changed input requires a new decision.

Governance metadata is not OS enforcement. The host/executor remains responsible for invoking these checks and for process isolation, credentials, network controls, and service permissions.

## Raw logs

Raw command output is recoverable under `.soturail/raw/` and may contain secrets. `soturail expand <raw_id>` redacts probable secrets. Exact local disclosure requires explicit CLI confirmation; MCP never accepts a caller-controlled raw-disclosure override.

Use these lifecycle commands to inspect metadata without exposing content:

```bash
soturail raw status
soturail raw inspect <raw_id> --redacted
soturail raw doctor
soturail raw purge --ttl 30d --dry-run
```

Raw records include sensitivity, fingerprint, and retention metadata. Never commit `.soturail/raw/`.

## MCP, hooks, and skills

The MCP server uses typed schemas, exposes a small capability-registry-mapped surface, and does not expose arbitrary shell execution. Modern protocol support coexists with explicitly tested legacy negotiation. Hooks, skills, and host exports are local artifacts for review; SotuRail does not auto-trust or auto-execute third-party instructions.

## Providers

External provider output is attributed evidence, not ground truth. Provider health and fallback must be explicit. An unavailable governance provider fails closed, and no fallback may weaken an existing deny. Provider credentials must stay outside generated artifacts and logs.

## Supply chain

CI runs full dependency audit, CodeQL, build, typecheck, tests, docs checks, MCP smoke, architecture drift checks, and native tests. Tagged builds generate a CycloneDX SBOM, SHA-256 checksums, a release manifest, and GitHub provenance/SBOM attestations.

See the complete [Threat Model](threat-model.md) and [Security Boundaries](security-boundaries.md).
