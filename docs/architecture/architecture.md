# Architecture

SotuRail v0.2.1 is a TypeScript/Node.js local-first CLI. It stores all runtime state in `.soturail/` inside the repository. An optional Rust reducer and runner binary can be used when present, but TypeScript remains the orchestration and fallback layer.

## Runtime Areas

- `.soturail/config/config.json` - validated Zod config.
- `.soturail/indexes/` - Heuristic Repo Map artifacts.
- `.soturail/raw/` - raw command logs and manifest.
- `.soturail/metrics/events.jsonl` - append-only local events.
- `.soturail/specs/` - Spec-Driven Development artifacts.
- `.soturail/memory/memory.jsonl` - Git-linked local memory.
- `.soturail/memory/pending.jsonl` and `approved.jsonl` - memory approval workflow.
- `.soturail/cache/blocks.jsonl` - stable prompt block manifest.
- `.soturail/rules/` - extracted rules, checklists and citations.
- `.soturail/hooks/hosts.json` - installed hook registry.

## Flow

```mermaid
sequenceDiagram
  participant User
  participant CLI as soturail
  participant Policy as safety-policy
  participant Runner as NativeRunnerAdapter
  participant Raw as raw-store
  participant Reducer as compressors
  User->>CLI: soturail run npm test
  CLI->>Policy: validate command
  Policy-->>CLI: ok
  CLI->>Raw: create log file
  CLI->>Runner: spawn shell command with pipes
  Runner-->>User: live stdout/stderr
  Runner-->>Raw: same chunks
  Runner-->>CLI: exit code and captured text
  CLI->>Reducer: compress summary
  CLI->>Raw: append manifest
  CLI-->>User: summary + raw_id
```

## Native Runner Boundary

`NativeRunnerAdapter` remains the TypeScript command execution seam. The optional `soturail-native` crate implements reducer paths and a native tee-stream runner hot path. Future versions can package prebuilt native binaries for npm.

## Repo Map

The indexer is intentionally a Heuristic Repo Map. It uses regex-based MVP extraction for TypeScript/JavaScript, Python and Java symbols. It does not claim full AST support.
