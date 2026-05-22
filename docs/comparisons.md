# Comparison Philosophy

SotuRail aims to unify these workflow ideas into one local-first, auditable, cache-friendly developer tool.

SotuRail is an independent implementation. It does not vendor or depend on RTK, Squeez, Caveman, MemPalace, Spec Kit, agent-skills, SkillsMP, Compozy, Superpowers, OpenSpec or Istara.

## Terminal Compression

RTK-like terminal compression is conceptually related. SotuRail focuses on reversible raw logs, `raw_id` recovery and local safety policy. It does not claim to outperform RTK without reproducible benchmark evidence.

## Hooks And Dedupe

Squeez-like hooks and dedupe are adjacent ideas. SotuRail has prompt-only fallbacks, conservative Claude hooks, context packs, whole-output dedupe and conservative block-level dedupe as an independent implementation. Similar-output dedupe is deterministic and experimental; it is not semantic AI matching.

## Response Compression

Caveman-like response compression inspired the idea of shorter agent output. SotuRail implements professional deterministic modes that preserve code blocks, commands, paths and warnings.

## Spec Workflows

Spec Kit-like workflows are related to SotuRail specs. SotuRail integrates specs with logs, metrics, memory and context packs.

## Local Memory

MemPalace-like memory/evidence ideas are related. SotuRail uses local JSONL memory with approval workflow and stale marking, not full semantic memory yet.

## Knowledge To Rules

Nicole-style knowledge-to-rules workflows are related. SotuRail has `ingest` and `rules` with future hardened PDF extraction.

## Skills, Agent Integrations And Workflow Orchestration

Agent-skills and SkillsMP-like ecosystems are related to Skill Rail exports. SotuRail exports prompt/context files and MCP snippets for Claude, Codex, Gemini, Cursor, Antigravity and generic agents without claiming host-native superiority.

Compozy, Superpowers and OpenSpec-style orchestration are related to Workflow Rail. SotuRail's Workflow Rail is a local state machine with optional Git worktree isolation; it does not push, merge or delete user work automatically.

SotuRail should not be described as better than these projects unless a specific local benchmark proves a specific metric.
