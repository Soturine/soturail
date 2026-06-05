# Multi-Agent Workflow Templates

SotuRail should support multi-agent ideas as templates and context packs, not as a required CrewAI/LangGraph runtime.

## Purpose

A multi-agent workflow template defines roles, inputs, outputs, evidence and verification criteria for external agents.

SotuRail can generate:

- role-specific context packs;
- role boundaries;
- definition of done per role;
- handoff files between roles;
- evidence requirements;
- a final report skeleton.

## Example Roles

```txt
Lead Agent
├── Researcher: collects local evidence and docs
├── Analyst: compares options and risks
├── Writer: produces user-facing docs/reports
└── Verifier: checks claims, tests, links and provenance
```

## Proposed Commands

```bash
soturail workflow template research-report
soturail workflow template validate-fix-verify-report
soturail context pack --role researcher
soturail context pack --role analyst
soturail context pack --role verifier
soturail agents export --role reviewer
```

## Template: Validate -> Fix -> Verify -> Report

Inspired by agent pipelines that validate input, repair issues, revalidate and then produce a report.

```txt
validate
  input: selected files, schema, policy
  output: findings.json
fix
  input: findings.json and allowed files
  output: patch proposal or instructions
verify
  input: patch proposal and test/report commands
  output: verification.md
report
  input: all prior artifacts
  output: report.md + provenance.md
```

## Non-Goals

- no mandatory CrewAI, LangGraph or LangChain dependency;
- no hidden subagent execution;
- no external web search by default;
- no autonomous edits without host/human approval.
