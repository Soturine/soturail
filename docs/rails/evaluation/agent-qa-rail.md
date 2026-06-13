# Agent QA Rail

Agent QA Rail tests SotuRail-generated agent artifacts with deterministic local fixtures.

## Commands

```bash
soturail eval dataset init
soturail eval dataset run
soturail eval golden
soturail eval regression
soturail eval report
```

Artifacts are written under `.soturail/evals/`.

## Golden Checks

The default checks verify that:

- host exports are non-empty and preserve SotuRail identity;
- exports avoid unrelated product or autonomous-runtime claims;
- knowledge packs include metadata and source maps;
- evidence reports do not claim unsupported verification;
- skills expose reviewed safety information;
- tasklets remain dry-run templates.

## Policy

Default Agent QA is offline, deterministic, provider-agnostic and safe for CI. Provider-backed LLM-as-judge evaluation remains optional and documentation-only; it is not a default release gate.

Passing these checks proves the local contracts were met. It does not prove every external agent will behave correctly.

Related: [Evaluation Suite](evaluation-suite.md), [Golden Agent Tests](golden-agent-tests.md), [Evidence Provenance Rail](../evidence/evidence-provenance-rail.md).
