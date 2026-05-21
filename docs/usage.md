# Usage

## Initialize

```bash
soturail init
```

Creates `.soturail/` and starter docs without overwriting existing files.

## Index

```bash
soturail index
```

Writes `.soturail/indexes/repo-map.json` and `.soturail/indexes/tree.txt`.

## Read

```bash
soturail read src/core/file-scanner.ts --query "ignore rules"
soturail read src/core/file-scanner.ts --full
```

Files under 150 lines are printed fully. Larger files include the first 15 lines, query matches with margin, the last 10 lines and reversible collapsed markers.

## Run and Expand

```bash
soturail run npm test
soturail expand <raw_id>
```

The runner streams output live, writes the same output to a raw log and prints a compressed summary.

## Specs and Memory

```bash
soturail spec new "safe command profiles"
soturail memory add "We block git push by default"
soturail memory search "git push"
```

## Doctor and Stats

```bash
soturail doctor
soturail doctor cache
soturail stats
```

## v0.2.x Workflows

```bash
soturail bench prepare
soturail bench run --engine ts
soturail hooks install codex --dry-run
soturail format README.md --mode concise
soturail ingest README.md --type docs
soturail rules check
soturail native doctor
soturail bench compare-engines
```

## v0.3.0 Workflows

```bash
soturail skills init demo-skill
soturail skills validate
soturail skills export --target claude
soturail context pack --target generic
soturail mcp doctor
soturail mcp manifest
soturail hooks install --agent claude --mode safe-hooks --dry-run
soturail release check
```

MCP is local stdio JSON-RPC style transport and does not expose arbitrary shell execution in v0.3.0.
