# Knowledge Graph Rail

Knowledge Graph Rail is the planned v1.3.x direction that builds on Project Brain, Reverse Specification Rail, reports and workflow evidence.

## Goal

Create a local, explainable graph that connects source files, docs, claims, decisions, tests, diagrams, workflows, releases and stale evidence.

```txt
file -> symbol -> claim -> decision -> test -> workflow -> release
```

## Planned Commands

```bash
soturail graph build
soturail graph explain src/core/report-rail.ts
soturail graph impact
soturail graph tour
soturail graph dashboard
soturail graph export --format json
```

## Planned Artifacts

```txt
.soturail/graph/latest.json
.soturail/graph/latest.md
.soturail/graph/impact.json
.soturail/graph/tour.md
.soturail/dashboard/graph.html
```

## Graph Nodes

Potential node types:

- file;
- symbol;
- command;
- claim;
- decision;
- rule;
- bug;
- test;
- workflow;
- diagram;
- release;
- report;
- benchmark;
- baseline;
- agent host;
- skill.

## Graph Edges

Potential edge types:

- defined-in;
- references;
- validates;
- invalidates;
- changed-by;
- released-in;
- depends-on;
- stale-because;
- derived-from;
- exported-to;
- verified-by.

## Safety And Accuracy Rules

- Prefer deterministic local extraction first.
- Every graph claim should link to source evidence when possible.
- Unknown relationships should remain unknown, not guessed.
- Stale or suspect edges should be separated from verified edges.
- No required vector database or cloud embeddings.
- No unsupported static-analysis claims before fixtures and benchmarks prove them.

## Relationship To Existing Rails

| Existing rail | Graph input |
| --- | --- |
| Project Brain | claims, decisions, stale events, rules |
| Reverse Specification Rail | claims, specs and gaps extracted from source/docs |
| Workflow Rail | tasks, phases, evidence and verification |
| Diagram Rail | `.spec.md` and Mermaid visual contracts |
| Report Rail | status, warnings and next commands |
| Benchmark Rail | performance evidence and native candidates |
