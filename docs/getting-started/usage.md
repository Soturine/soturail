# Usage

This page is the practical CLI companion to the agent-first workflow in the [Quickstart](quickstart.md). Agents should prefer Skills + capability discovery; humans and CI can use the same underlying functions through the CLI.

## Initialize and inspect

```bash
soturail init
soturail doctor
soturail index
soturail status --json
```

SotuRail stores generated state under `.soturail/` and does not require a hosted service for normal local operation.

## Progressive repository reads

```bash
soturail read src/core/file-scanner.ts --query "ignore rules"
soturail read src/core/file-scanner.ts --full
```

Use progressive reads instead of dumping an unfamiliar repository into an agent context.

## Skills and capability discovery

```bash
soturail skills discover
soturail skills describe soturail-change
soturail capabilities list
soturail capabilities describe contract.verify
```

Project portable Skills live under `.agents/skills/<name>/SKILL.md`; verified host projections can be installed with `skills export --layout portable --install`.

## Run commands and keep evidence

```bash
soturail run -- npm test
soturail expand <raw_id>
soturail evidence report
```

The runner keeps a recoverable raw record while exposing a safer summarized surface. Evidence used for readiness must be current for the workspace being verified.

## Change Contracts

```bash
soturail contract create login-fix \
  --title "Fix login regression" \
  --intent "Restore login behavior" \
  --criterion "tests pass" \
  --check "npm test" \
  --criterion-check "npm test"

soturail run -- npm test
soturail contract verify .soturail/contracts/login-fix.json
```

If the contract foundation changes, use `contract revise` instead of rewriting the original contract.

## Human/manual attestations

Human approval, independent review and manual criteria use interactive `contract attest` receipts. Caller assertion flags do not satisfy readiness by themselves.

## MCP

```bash
soturail mcp doctor
soturail mcp manifest
soturail mcp smoke
soturail mcp exposure
soturail mcp serve --transport stdio
```

The default MCP surface is typed and bounded. It does not expose arbitrary shell execution.

## Context, knowledge and memory

```bash
soturail context select --query "release risk"
soturail context budget --explain
soturail knowledge list
soturail memory recall "release"
```

Context remains budgeted and provenance-aware. Semantic interpretation belongs to the active agent; lexical ranking is only a fallback where documented.

## Diagnostics

```bash
soturail doctor
soturail self architecture --check
soturail self code-health
soturail release check
```

## Release qualification

```bash
npm run build
npm run typecheck
npm test
npm run docs:check
npm audit
node dist/cli.js mcp smoke
node dist/cli.js self architecture --check
npm run release:check
```

For the full command additions shipped in v1.6, see [v1.6 Commands](../reference/commands/v1.6-commands.md).
