# Code Graph Seed

v0.9.0 keeps parser and graph work experimental.

The current implementation does not add a graph database, embeddings, MCP dependency, Tree-sitter dependency or mandatory parser runtime. The roadmap seed is local and benchmark-gated:

```txt
parse scan ./src
parse symbols ./src
graph build
graph query "release notes path"
graph impact src/core/project-brain.ts
```

These commands are deferred until v0.9.1 or later unless benchmark reports show that heuristic source scanning needs a structural index.

## Planned Storage

```txt
.soturail/graph/files.jsonl
.soturail/graph/symbols.jsonl
.soturail/graph/edges.jsonl
.soturail/graph/graph-index.json
```

## Boundary

- no graph database;
- no embeddings;
- no network calls;
- no LLM extraction;
- TypeScript fallback stays mandatory;
- any native/parser acceleration must have a benchmark first.

## Knowledge Graph Rail Planning

The broader Knowledge Graph Rail is tracked in [`knowledge-graph-rail.md`](knowledge-graph-rail.md). `code-graph.md` remains the seed for code-focused graph ideas, while the future rail connects code, docs, claims, decisions, diagrams, workflows, reports and releases.
