# SotuRail v1.1.0

SotuRail v1.1.0 adds Host Compatibility Rail 1.0: host-aware exports, a richer compatibility matrix, per-host doctor reports, read-only MCP host manifests and practical docs for OpenCode, Antigravity, Gemini-compatible and DeepAgents-style handoffs.

## Added

- `soturail agents matrix --json` now preserves `soturail.agents.matrix.v1` and adds `contractId: soturail.agent-host-matrix.v1`.
- `soturail agents doctor --host <host>` writes `.soturail/agents/<host>/doctor.json` and `.md`.
- `soturail agents doctor --all --json` writes `.soturail/agents/doctor-summary.json` and `.md`.
- `soturail mcp resources host-manifest --host <host> [--json]` writes read-only host manifests.
- `soturail agents export --agent gemini-legacy` supports Gemini legacy/compatible handoffs.
- OpenCode exports include `AGENTS.md` and context packs.
- Antigravity exports include high-priority experimental transition guidance.
- DeepAgents/deepagents-js exports include `role-pack.md` and `subagents.md`.

## Changed

- Default agent exports are mirrored to `.soturail/agents/<host>/` and `.soturail/exports/agents/<host>/`.
- Agent reports support OpenCode, Antigravity, Cursor, Gemini legacy and DeepAgents-style targets.
- Docs now include host matrix schema, export contract, MCP host manifest, OpenCode tutorial and media guidance.
- README and ROADMAP now mark v1.1.0 Host Compatibility Rail as delivered.

## Safety

- No cloud telemetry.
- No server requirement.
- No destructive MCP tools.
- No shell execution through MCP.
- No provider lock-in.
- TypeScript fallback remains mandatory.
- Experimental hosts are labeled honestly; OpenCode is generic-compatible, Antigravity is experimental, and DeepAgents exports are role/context artifacts only.

## Verification

Run before publishing:

```bash
npm run typecheck
npm run build
npx vitest run tests/v110.test.ts
npx vitest run tests/v100.test.ts
npm test
npm run release:check
node dist/cli.js agents matrix --json
node dist/cli.js agents doctor --all --json
node dist/cli.js mcp resources host-manifest --host codex --json
node dist/cli.js report agent --agent opencode
```

## Known Limitations

- Host compatibility remains export/report/manifest oriented; SotuRail does not become a host runtime.
- Antigravity support remains prompt/context only until a stable Google-local project config surface is documented.
- OpenCode support is generic-compatible and does not claim full host-native integration.
- DeepAgents exports are role packs and subagent notes only; no runtime dependency is installed.
