# Comparison Philosophy

SotuRail aims to unify adjacent context-engineering workflow ideas into one local-first, auditable, cache-friendly developer tool.

SotuRail is an independent implementation. It does not vendor, copy, wrap or depend on RTK, Squeez, SQZ, Caveman, LLMLingua, TOON, SWE-Pruner, AgentMemory, Hermes-Agent, Plano, MemPalace, Spec Kit, agent-skills, SkillsMP, Compozy, Superpowers, OpenSpec, Istara, Kiro, OpenCode, Amp, Gemini CLI or similar projects.

SotuRail should not be described as better, faster or more accurate than these projects unless a specific reproducible benchmark proves a specific metric.

## Positioning Summary

```txt
Hermes-like systems: the agent brain and execution loop.
Plano-like systems: the gateway, router and production data plane.
SotuRail: the local Context OS that prepares, filters, compresses, remembers, governs and reports what agents need.
```

SotuRail's product identity is deliberately narrower than a full agent runtime and lighter than a production gateway:

- local-first;
- npm-friendly;
- safe-by-default;
- reversible raw evidence;
- approved memory;
- query-aware context;
- deterministic reducers;
- workflow records;
- honest metrics.

## Adjacent Project Matrix

| Project / family | Primary focus | What SotuRail should learn | Where it maps in SotuRail |
| --- | --- | --- | --- |
| Caveman | Short agent responses, terse output discipline, prompt/skill-style output compression | Make concise reports and compression modes useful without turning the whole product into a persona | `format`, `report`, future terse report modes |
| Squeez / squeez variants | Hook-based terminal/tool-output compression, dedupe, MCP, session memory | Improve adaptive compression, session summaries, token-budget awareness and MCP-safe output reducers | `run`, `dedupe`, `mcp`, `memory`, `bench` |
| SQZ | Multi-platform command-output compression and context intelligence | Make stats, extension paths and clean UX easier to understand for real users | `stats`, `report`, future integrations |
| RTK | Fast Rust/native terminal reduction and proxy-like token savings | Keep native acceleration optional and benchmark-driven; do not rewrite the CLI too early | `native`, `bench compare-engines` |
| LLMLingua | Prompt compression with information-preservation focus | Measure quality, not just token savings; preserve diagnostic facts | `context select`, `context prune`, `bench` |
| TOON | Compact structured data representation | Add deterministic compact structured payload modes for repeated JSON/YAML/log data | `format --mode compact`, future structured payload modes |
| SWE-Pruner / long-code pruning | Task-aware code context pruning | Select context by query, file, symbol and reason; do not only truncate by size | `context select --query` |
| AgentMemory / SimpleMem / TencentDB-Agent-Memory-style systems | Persistent memory for coding/agent sessions | Store approved local memory, recall by query and avoid secret leakage | `memory remember`, `memory recall`, `memory capture` |
| Agent governance tools | Policies, approvals, audit logs, least privilege and tool safety | Add local policy checks before raw expansion, MCP exposure and global config writes | `policy doctor`, `policy validate`, `policy explain` |
| Hermes-Agent-style systems | Agent loop, memory, skills, session/trajectory compression | Use memory, skills and trajectory summaries without becoming the agent runtime itself | `memory`, `skills`, `workflow`, `report` |
| Plano-style systems | Gateway, routing, observability, traces, guardrails | Add local traces and reports before exploring any gateway mode | `trace`, `report`, future Gateway Lite |
| Kiro-style workflows | Specs, steering, hooks and smart context | Strengthen PRD/tasks/TDD/release workflows and safe steering docs | `workflow`, `spec`, `rules` |
| Gemini CLI / Claude Code / Codex / Cursor / Antigravity / OpenCode / Amp-like hosts | Agent hosts with different context, hook, MCP and config surfaces | Maintain a host capability matrix and conservative prompt-only fallback | `agents capabilities`, `agents export`, `mcp` |

## Terminal Compression

RTK-like and Squeez-like terminal compression are conceptually related. SotuRail focuses on reversible raw logs, `raw_id` recovery, local safety policy and reducer quality.

SotuRail should continue improving:

- command-specific reducers for noisy developer tools;
- exact raw recovery;
- redacted default expansion;
- conservative block-level dedupe;
- optional native hot paths only when benchmarked.

SotuRail does not claim to outperform RTK, Squeez or SQZ without reproducible local benchmark evidence.

## Hooks And Dedupe

Squeez-like hooks and dedupe are adjacent ideas. SotuRail has prompt-only fallbacks, conservative Claude hooks, context packs, whole-output dedupe and conservative block-level dedupe as an independent implementation.

Similar-output dedupe is deterministic and experimental. It is not semantic AI matching.

Future improvements:

- session-level dedupe reports;
- command-family dedupe summaries;
- cache-friendly repeated-block references;
- safer hook docs per host;
- host capability matrix before deeper integration.

## Response Compression

Caveman-like response compression inspired the idea of shorter agent output. SotuRail should keep professional deterministic modes that preserve:

- code blocks;
- commands;
- file paths;
- warnings;
- exact errors;
- security notes;
- raw recovery hints.

Future idea: add a report profile similar to `terse`, but keep it documented as a practical output mode, not the core product identity.

## Context Selection And Pruning

LLMLingua, SWE-pruning and long-code benchmark projects point toward a stronger lesson: reducing text is not enough. Context selection should preserve the information needed to solve the task.

SotuRail v0.5.x should prioritize:

- `soturail context select --query "..."`;
- source paths and line ranges;
- scores and inclusion reasons;
- omitted-context summaries;
- preservation checks for errors, commands, paths and expected/actual values;
- quality benchmarks, not token savings alone.

## Structured Payload Compression

TOON-style structured data formats show that repeated JSON/YAML keys can waste tokens. SotuRail should explore a deterministic compact structured payload mode for:

- large JSON arrays;
- tool payloads;
- repeated diagnostic records;
- benchmark rows;
- memory recall records;
- workflow traces.

JSON should remain the source of truth. Compact payloads should fall back to JSON/Markdown if the structure is ambiguous.

## Local Memory

MemPalace-like, AgentMemory-like, SimpleMem-like and TencentDB-Agent-Memory-like projects are related to Memory Rail.

SotuRail should stay local-first and conservative:

- JSONL/default local storage first;
- approved-memory-only exports;
- redaction before storage and export;
- query-based recall;
- source and path metadata;
- confidence/importance/status fields;
- stale/conflict handling;
- no required database, cloud embeddings or external API in the default path.

## Knowledge To Rules

Knowledge-to-rules workflows are related to SotuRail's `ingest` and `rules` commands. SotuRail should continue turning docs into smaller, auditable local rules without inventing requirements that do not appear in the source.

Future improvements:

- richer citations;
- stale evidence detection;
- rule search;
- safer PDF and long-document extraction;
- connection between rules, memory and workflow verification.

## Skills, Agent Integrations And Workflow Orchestration

Agent-skills and SkillsMP-like ecosystems are related to Skill Rail exports. SotuRail exports prompt/context files and MCP snippets for Claude, Codex, Gemini, Cursor, Antigravity and generic agents without claiming host-native superiority.

Compozy, Superpowers and OpenSpec-style orchestration are related to Workflow Rail. SotuRail's Workflow Rail is a local state machine with optional Git worktree isolation; it does not push, merge or delete user work automatically.

Kiro-style workflows reinforce the value of specs, steering files, hooks and repeatable task plans. SotuRail should strengthen PRD -> tasks -> TDD -> verification -> release workflows in v0.7.x.

## Agent Runtime And Gateway Ideas

Hermes-Agent-style systems are useful inspiration for memory, skills, trajectory summaries and tool definitions. SotuRail should not become a full autonomous agent runtime by default.

Plano-style systems are useful inspiration for routing, traces, observability and guardrails. SotuRail should not become a heavy production gateway before the local rails are stable.

A future Gateway Lite can be explored only after memory, context selection, policy and reports are mature.

## Host Capability Matrix

Different agent hosts expose different levels of control. SotuRail should document and eventually encode those differences:

| Host family | Recommended SotuRail posture |
| --- | --- |
| Claude Code | settings/hooks/MCP where stable; dry-run-first and backup-first |
| Codex | conservative prompt-only/context-pack mode until hard hook/input rewriting is stable |
| Gemini CLI | MCP/context files/prompt fallback where supported |
| Cursor | rules/context exports, no unsafe global overwrite |
| Antigravity | prompt-only/context-pack until stable official integration surfaces are verified |
| OpenCode/Amp/Kiro-style hosts | prompt/context exports first, deeper integrations only after official surfaces are clear |
| Generic agents | Markdown/context packs and MCP read-only resources |

## Benchmark Standard

Whenever SotuRail compares itself to an adjacent idea, the benchmark must report:

- input size;
- output size;
- estimated token savings;
- metadata overhead;
- quality pass/fail;
- whether diagnostic lines were preserved;
- raw recovery path;
- platform and Node version;
- native fallback status where relevant.

The default public stance should remain:

```txt
SotuRail learns from adjacent projects, but only local reproducible benchmarks can justify performance or quality claims.
```
