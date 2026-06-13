# SotuRail v1.2.0

SotuRail v1.2.0 adds Harness Lifecycle Rail and incorporates the v1.1.1 host-compatibility/ecosystem documentation polish. It keeps SotuRail CLI-first, npm-first, local-first, provider-agnostic and safe by default.

## Added

- `soturail harness init` for safe local lifecycle scaffolding that preserves existing files by default.
- `soturail harness audit [--json]` for deterministic lifecycle readiness reports.
- `soturail session start|end` for bounded local session state.
- `soturail handoff generate` for local agent/host handoffs.
- `soturail feature add|start|done|list` backed by `.soturail/state/feature_list.json`.
- Hermes Agent and Odysseus ecosystem classifications.
- Agent And Harness Synthesis, Security Boundaries, Harness Lifecycle Rail and proposed Conductor docs.
- Deterministic host-export golden safety checks.

## Boundaries

- Hermes is documented as an agent runtime.
- Odysseus is documented as a workspace/runtime/local-services stack.
- SotuRail remains the local context/harness/governance layer.
- SotuRail Conductor is proposed future work and is not implemented.
- No cloud telemetry, required server, provider API key, destructive MCP tool or autonomous edit loop was added.

## Verification

```bash
npm run typecheck
npm run build
npx vitest run tests/v120.test.ts
npx vitest run tests/v110.test.ts
npm test
npm run release:check
node dist/cli.js harness init
node dist/cli.js harness audit --json
node dist/cli.js feature list
node dist/cli.js handoff generate
```

## Known Limitations

- Spec/Design/Diagram expansion remains planned after the delivered lifecycle slice.
- Dashboard lifecycle cards and a dedicated Host Fit Doctor alias remain planned; current host fit uses `agents matrix` and `agents doctor`.
- Conductor commands are documentation-only and require a future approval-gated design.
