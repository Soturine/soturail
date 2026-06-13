# Evidence And Provenance Rail

Evidence And Provenance Rail records what local artifacts support a report and what remains uncertain.

## Commands

```bash
soturail evidence collect
soturail evidence verify
soturail evidence report
```

Each run writes:

```txt
.soturail/evidence/<run-id>/
  evidence.json
  report.md
  provenance.md
```

## Status Model

| Status | Meaning |
| --- | --- |
| `verified` | Backed by a locally recorded check or direct local evidence |
| `unverified` | No sufficient proof is available |
| `blocked` | Verification cannot proceed because evidence is missing or failed |
| `inferred` | Derived from local artifacts but not directly proven |

Collection reads knowledge source maps, local report artifacts and read-only `git status --short`. Verification checks recorded source paths without executing commands. Reports explicitly state that unsupported verification is not claimed.

## Safety Boundary

- No private shell history is collected.
- No verification command is silently executed.
- No cloud evidence store or telemetry upload.
- Missing proof remains unverified, inferred or blocked.
- Provenance files must not expose secrets.

Related: [Report Rail](report-rail.md), [Knowledge Rail](../knowledge/knowledge-rail.md), [Security Boundaries](../../security/security-boundaries.md).
