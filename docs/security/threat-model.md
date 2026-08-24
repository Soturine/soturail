# Threat Model

SotuRail is a guardrail, provenance, and readiness layer. It is not a sandbox, endpoint security product, secret manager, or proof that an external side effect occurred.

| Surface | Threat | v1.5 control | Residual boundary |
|---|---|---|---|
| Filesystem | traversal, absolute paths, symlink escape, Windows path ambiguity | `WorkspaceGuard` canonical/real-path containment and sensitive-path classification | OS ACLs and hostile concurrent filesystem changes remain external |
| Artifacts | partial writes, malformed JSONL tail, collision, stale reuse | canonical registry, atomic store, tail recovery, hashed topic IDs, workspace fingerprints | full N-1 migration/rollback arrives after v1.5 |
| MCP | schema confusion, oversized surface, arbitrary shell, raw exfiltration | official typed server SDK, modern protocol with legacy negotiation, small capability-mapped surface, no shell tool, no caller raw authorization | host permissions and transport security are external |
| Raw logs | credentials or personal data in command output | default redaction, sensitivity/fingerprint/retention metadata, inspect/status/doctor/purge, explicit local CLI disclosure | a process that can read `.soturail/raw` can bypass the CLI |
| Hooks and skills | unreviewed instructions or unexpected mutation | local review, dry-run/backup defaults, capability metadata, no automatic third-party execution | SotuRail cannot prove a host obeyed exported instructions |
| Providers | malicious/stale output, timeout, schema drift, credential exposure | attributed results, health/fallback contract, fail closed for authority, no mandatory provider | provider infrastructure and credentials require their own controls |
| Capability drift | CLI/MCP/docs disagree about exposure or maturity | canonical registry, registry digest, epochs, architecture drift checks | metadata is not operating-system enforcement |
| Side effects | approval replay or evaluated/executed payload mismatch | Dual Gate plus exact-digest Execution Envelope | executor must actually invoke verification before acting |
| Supply chain | vulnerable dependencies or unverifiable package | full npm audit, CodeQL, SBOM, checksums, manifest, GitHub provenance/SBOM attestations | registry/GitHub account security remains external |

## Authority and readiness

Authority and readiness are independent. A permitted action with insufficient engineering evidence is denied progression; a verified change without actor authority is also denied. Provider unavailability cannot convert to allow. The Execution Envelope binds the exact evaluated payload, contract, workspace, verdict, and capability epoch; a digest mismatch is `NOT_ATTESTED`.

## Credentials and sensitive state

Do not commit `.soturail/raw/`, environment files, provider tokens, or generated credentials. Workspace fingerprints hash approved metadata and exclude secret values. Provider adapters must accept credentials through their own documented secret channel and must not copy them into artifacts, context, logs, manifests, or receipts.

## What SotuRail does not protect

- It does not isolate processes or replace container/OS permissions.
- It cannot stop a user or compromised process from reading files it already has permission to read.
- It does not validate every third-party skill, hook, model response, package, or network service.
- It does not make destructive shell commands safe or guarantee rollback.
- It does not prove physical, production, or external-service behavior unless that observation is captured as evidence.

See [Security Model](security-model.md), [Security Boundaries](security-boundaries.md), and [Governance Model](../architecture/governance-model.md).
