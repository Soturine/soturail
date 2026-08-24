# AGENTS.md

Use this file as the concise entrypoint for agents working in a SotuRail repository.

## Workflow

- Run `soturail index`, then use `soturail read <file> --query "goal"` instead of dumping the repository.
- Run commands through `soturail run -- <command...>` so the redacted summary and recoverable raw record stay linked.
- Define material work with a Change Contract. Treat Authority Gate and Readiness Gate as independent; both must pass.
- Treat generated, reviewed, verified, runtime-observed, human-approved, blocked, inferred, and stale as distinct states.

## Invariants

- Never bypass `WorkspaceGuard` for caller-controlled paths or `ArtifactStore`/`ArtifactRegistry` for critical artifacts.
- Never add caller-controlled raw disclosure to MCP or expose arbitrary shell execution there.
- Keep `evals/` canonical, bind reusable evidence/context to `WorkspaceFingerprint`, and make stale state visible.
- Capability metadata and an Execution Envelope are guardrails, not an OS sandbox. Execute only the exact evaluated digest.
- External providers enrich; they do not become ground truth or weaken a deny when unavailable.

## Sources of truth

- Current contracts: `docs/reference/`
- Current architecture: `docs/architecture/`
- Security/threat boundaries: `docs/security/`
- Future dependencies and status: `ROADMAP.md` and the implementation tracker
- History: `CHANGELOG.md` and `docs/releases/`

## Validation and release

After a focused change, run its module tests and typecheck/build as appropriate. Before release run build, typecheck, full tests, docs check, full audit, MCP smoke, architecture check, native tests, release preflight, and package verification. Preserve honest blockers and known limitations.

Do not push, tag, publish, or create a release unless the user explicitly authorizes it. Never force-push or overwrite a public tag.
