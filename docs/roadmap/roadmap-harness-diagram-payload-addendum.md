# Roadmap Addendum: Harness, Diagram And Structured Payload Rails

This addendum extends the current SotuRail roadmap without replacing or removing any existing milestone.

The main roadmap remains `ROADMAP.md`. This file adds detail for the newest planned rails inspired by agent harnesses, Mermaid Diagram Driven Development, structured prompt payloads, policy queues and evidence-driven workflows.

## Summary

SotuRail should continue evolving as a local-first Context OS for AI coding agents.

The next product additions should not turn SotuRail into a full agent runtime, a Claude-only plugin, a Mermaid-only workflow tool or a heavy gateway. They should strengthen SotuRail's existing identity:

```txt
local context + memory + policy + evidence + workflow + reports
```

## New Roadmap Themes

### 1. Harness Rail

Harness Rail makes agent-assisted development more disciplined.

Planned ideas:

```txt
setup -> plan -> work -> review -> release
```

Possible future commands:

```bash
soturail workflow setup
soturail workflow plan
soturail workflow work
soturail workflow review
soturail workflow release
soturail workflow evidence <id>
soturail release evidence
```

What it adds:

- clearer workflow phases;
- review perspectives;
- release evidence packs;
- repeatable verification;
- safer handoff between human and agent;
- a Harness Failure Ledger for repeated agent mistakes.

### 2. Policy Rail

Policy Rail makes risky actions explainable and reviewable.

Possible future commands:

```bash
soturail policy rules
soturail policy doctor
soturail policy validate
soturail policy explain <id>
soturail policy queue
soturail policy approve <id>
soturail policy reject <id>
soturail policy auth-check
```

Example rules:

```txt
R01 deny sudo
R02 deny writing .env or secret files
R03 ask before rm -rf
R04 deny git push --force
R05 ask before npm publish
R06 deny --no-verify unless explicitly approved
R07 warn before direct push to main/master
R08 require evidence before release
R09 deny arbitrary shell exposure through MCP by default
R10 require explicit confirmation for raw log expansion
R11 backup before agent host config writes
R12 warn when agent docs contain probable secrets
R13 warn when JSON payloads have duplicate keys or unsafe ambiguity
```

### 3. Diagram Rail

Diagram Rail uses Mermaid and `.spec.md` files as compact, versioned visual contracts.

Core flow:

```txt
diagram first -> visual approval -> implementation -> tests -> evidence
```

Possible future commands:

```bash
soturail diagram init
soturail diagram new <feature>
soturail diagram audit <file>
soturail diagram validate
soturail diagram sync
soturail diagram from-workflow <id>
soturail diagram from-repo
soturail workflow diagram <id>
```

Useful diagram outputs:

- workflow state machine;
- release pipeline;
- MCP resource/tool flow;
- agent context handoff;
- policy approval flow;
- memory/context selection flow;
- feature `.spec.md` business rules;
- architecture module map;
- failure recovery path.

### 4. Structured Payload Rail

Structured Payload Rail chooses the best context representation for the target agent or consumer.

Default guidance:

```txt
JSON       -> machine/config/MCP/tool payloads
Markdown   -> human docs, README, ROADMAP, AGENTS.md
Tagged     -> long LLM prompt context with clear boundaries
TOON/table -> repetitive structured data
Mermaid    -> visual workflow, architecture and state context
```

Possible future commands:

```bash
soturail context pack --target claude --format tagged
soturail context pack --target gemini --format tagged
soturail context pack --target codex --format markdown
soturail context pack --target mcp --format json
soturail format file.json --to tagged
soturail format file.json --to toon
soturail format compare docs/getting-started/usage.md --formats markdown,tagged,json,toon
soturail validate json config.json --strict
```

The goal is not to say XML is always better than JSON. The goal is to choose the right format for the job.

### 5. Agent Docs Hygiene

Root agent files should stay short and useful.

Future commands:

```bash
soturail docs lint
soturail agents docs doctor
soturail agents docs split
soturail agents docs suggest
```

Agent docs linting should warn about:

- huge `CLAUDE.md` / `AGENTS.md` files;
- repeated rules;
- stale commands;
- missing build/test commands;
- missing project purpose;
- probable secrets;
- too much generic advice;
- unclear module ownership.

Simple rule:

```txt
CLAUDE.md / AGENTS.md should be short.
Specs, diagrams, rules and module docs should hold detailed context.
SotuRail should select and route the right context when needed.
```

### 6. Context Expert Router

Context Expert Router is a local routing metaphor, not a neural MoE implementation.

MoE routes computation to the right experts. SotuRail routes context to the right task, role, workflow or agent.

Possible future commands:

```bash
soturail context select --query "fix npm publish on Windows"
soturail context route --role reviewer
soturail context route --role release-manager
soturail context route --role security
```

Planned experts:

- release expert;
- test expert;
- security expert;
- frontend expert;
- backend expert;
- docs expert;
- MCP expert;
- workflow expert;
- memory expert;
- policy expert.

### 7. Evaluation Suite

The evaluation suite should prove whether the rails are useful.

v0.5.2 should measure:

- token savings;
- quality retention;
- context selection accuracy;
- role-pack relevance;
- format comparison: Markdown vs tagged vs JSON vs compact formats;
- reducer quality;
- dedupe quality;
- evidence pack completeness;
- whether critical paths, commands, errors and warnings survived pruning.

## Version Mapping

### v0.5.0

Add early versions of:

- Memory Rail;
- Context Intelligence;
- Context Expert Router;
- Policy/Governance Rail;
- Harness Failure Ledger;
- Evidence Pack;
- Agent Docs Hygiene;
- structured context blocks;
- native reliability investigation.

### v0.5.1

Add polish and structured payload work:

- target-aware context formats;
- Markdown/tagged/JSON/TOON output modes;
- JSON strict validator;
- duplicate-key detection;
- format comparison report;
- `CLAUDE.md` / `AGENTS.md` linting;
- Diagram Rail basic validation.

### v0.5.2

Add evaluation and benchmarks:

- with/without SotuRail benchmarks;
- context quality benchmarks;
- role-pack quality benchmarks;
- format quality benchmarks;
- evidence pack validation;
- harness scenarios.

### v0.7.0

Expand Workflow Rail 2.0:

- setup/plan/work/review/release phases;
- review perspectives;
- workflow evidence;
- Mermaid-driven workflow;
- `.spec.md` support;
- workflow diagram generation;
- release diagram generation;
- context router diagrams.

### v0.10.0

Connect reports and visual output:

- local HTML reports;
- trace viewer;
- Mermaid rendering;
- policy report;
- memory report;
- evidence report;
- context selection report;
- optional dashboard exploration inspired by MCP UI, AG-UI and OpenUI-style systems.

## Related Docs

- [Harness Rail](../rails/harness/harness-rail.md)
- [Policy Rail](../rails/governance/policy-rail.md)
- [Diagram Rail](../rails/design/diagram-rail.md)
- [Structured Payload Rail](../rails/context/structured-payload-rail.md)
- [Workflow Rail](../rails/harness/workflow-rail.md)
- [Context Packs](../rails/context/context-packs.md)
- [Security Model](../security/security-model.md)
- [Ecosystem Influences](../ecosystem/ecosystem-influences.md)
- [Comparisons](../ecosystem/comparisons.md)
