# Roadmap Addendum: Agent Runtime Rails

This addendum updates the SotuRail roadmap with the newest agent-infrastructure patterns observed around Claude Code, Codex, Gemini CLI, MCP, Agent Skills, Leoflow-style workflow staging, reverse specification extraction and harness-driven delivery.

It does not replace `ROADMAP.md`. It tightens the plan so future rails are functional, connected and staged instead of becoming a loose list of ideas.

## Product Position

```txt
SotuRail is the local-first Context OS and evidence rail for AI coding agents.
It does not replace Claude Code, Codex, Gemini CLI, Cursor, Antigravity or future agent hosts.
It prepares, compresses, routes, stores, validates and reports the context those agents need.
```

The strategic direction stays:

```txt
agent host = model, planning loop, editing surface, tools and execution UI
SotuRail = local context, rules, budgets, skills, per-run workspace, harness evidence and safety reports
```

## What Changed In The Ecosystem

### 1. Coding agents are becoming multi-surface and multi-agent

Claude Code now describes itself as an agentic coding tool available across terminal, IDE, desktop app and browser, with MCP, skills, hooks, memory, multiple agents, background agents and scheduled tasks.

Codex has moved beyond a terminal-only assistant into a coding-agent product with cloud environments, worktrees, Skills, automations and multi-agent workflows.

Gemini CLI introduced an open-source terminal agent with MCP support, `GEMINI.md`, high context windows and scripting/non-interactive workflows.

Roadmap impact for SotuRail:

- stop thinking only in terms of one prompt and one terminal output;
- generate host-aware exports for many agent surfaces;
- track which agent host receives which context, skill, policy and evidence;
- keep SotuRail independent from any one host.

### 2. MCP and Agent Skills now need a stricter boundary

MCP is the standard bridge for external tools, data, resources and workflows. Agent Skills are lighter packages of instructions, procedures and supporting files that are loaded when relevant.

SotuRail should treat them differently:

```txt
MCP = external capability boundary
Skill = reusable local operating procedure
Context pack = selected task evidence
Policy = what is safe to expose or execute
Harness = what must pass before work is accepted
```

Roadmap impact:

- `soturail mcp exposure` should list tools, resources, prompts, roots and risk notes;
- `soturail skills route` should suggest skills only when task evidence matches;
- `soturail agents export` should state which host supports MCP, skills, hooks, settings or prompt-only fallback;
- skill bodies should not become giant always-loaded context files.

### 3. Context cost is now a product feature, not just a benchmark

Claude Code and similar tools charge or limit by context and tool usage. Practical guidance around `/context`, `/usage`, `/clear`, `/compact`, small root docs, careful MCP selection and concise skills maps directly to SotuRail.

Roadmap impact:

- add **Context Budget Rail**;
- show estimated cost drivers before handoff;
- separate stable context from dynamic context;
- warn about huge `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, copied logs and broad MCP exposure;
- recommend offload or compacting before a task becomes expensive.

### 4. Per-run staging is useful even without Kubernetes

Leoflow's staging-volume design shows a clean pattern: every workflow run gets an isolated temporary workspace where intermediate artifacts live, survive retries, and are garbage-collected after a TTL.

SotuRail should not copy the Kubernetes PVC design now. The local-first equivalent is simpler:

```txt
.soturail/runs/<run-id>/
  input/
  output/
  raw/
  offload/
  artifacts/
  evidence/
  workspace.json
  summary.md
  handoff.md
```

Roadmap impact:

- add **Run Workspace Rail**;
- every workflow, harness run and agent handoff should have one run id;
- large logs and generated artifacts should live in run storage, not in prompt context;
- TTL and cleanup should be explicit and safe.

### 5. Reverse documentation is becoming agent infrastructure

Reversa-style reverse documentation shows how legacy code can be converted into operational specifications with traceability, confidence, gaps and validation items.

SotuRail already has Knowledge-to-Rules. The missing connection is a more explicit **Reverse Specification Rail**:

```txt
repo/code/config/logs -> claims -> rules -> specs -> gaps -> validation checklist -> agent handoff
```

Roadmap impact:

- `soturail reverse scan` should identify project surface, modules and docs;
- `soturail reverse claims` should extract claims with source paths and confidence;
- `soturail reverse specs` should generate draft specs and gaps;
- `soturail rules check` should validate only claims backed by evidence.

### 6. Agent harnesses should block premature "done"

The strongest pattern from harness posts is that the agent should not be trusted just because it says it finished. The harness decides whether the work can be accepted.

Roadmap impact:

- add **Acceptance Harness Contracts**;
- make status gates explicit: build, typecheck, lint, tests, coverage, docs, policy, release pack;
- store failure history so repeated misses become rules or checks;
- connect `workflow verify`, `harness doctor`, `policy doctor`, `fs diff` and `report`.

## Updated Rail Map

| Rail | Purpose | First useful version | Depends on |
| --- | --- | --- | --- |
| Run Workspace Rail | Per-run folders for input/output/raw/offload/artifacts/evidence | v0.5.0 seed | workflow, run, expand |
| Context Budget Rail | Estimate context cost drivers and suggest compaction/offload | v0.5.0 seed | context pack, agents lint, bench |
| MCP Exposure Rail | Explain exposed tools/resources/prompts and risk | v0.5.0 seed | mcp, policy |
| Skill Boundary Rail | Route skills by task, role and host support | v0.5.0 seed | skills, agents export, context route |
| Acceptance Harness Contracts | Block done/release until checks pass | v0.5.0 seed, v0.7.0 expansion | workflow, policy, fs evidence |
| Reverse Specification Rail | Convert existing code/docs into rules/specs/gaps with traceability | v0.8.0 primary, v0.5.x design | ingest, rules, memory |
| Agent Runtime Adapter | Host-aware export matrix for Claude, Codex, Gemini, Cursor, Antigravity and generic hosts | v0.6.0 | agents, context, skills, mcp |

## Command Shape

These commands should be staged gradually. They are not all required in the same release.

### v0.5.x seeds

```bash
soturail run workspace new "feature title"
soturail run workspace show <run-id>
soturail run workspace clean --ttl 7d --dry-run

soturail context budget
soturail context budget --target claude
soturail context budget --explain

soturail mcp exposure
soturail mcp exposure --json
soturail skills route --task "review this PR"

soturail harness contract init
soturail harness contract check
soturail harness note "agent said done before coverage passed"
```

### v0.6.x agent host integration

```bash
soturail agents capabilities
soturail agents export --agent claude --with-skills --with-mcp --dry-run
soturail agents export --agent codex --with-agents-md --dry-run
soturail agents export --agent gemini --with-gemini-md --dry-run
soturail agents explain --agent all
```

### v0.7.x workflow/harness expansion

```bash
soturail workflow setup
soturail workflow plan
soturail workflow work
soturail workflow review --all
soturail workflow verify
soturail workflow evidence <id>
```

### v0.8.x reverse specification

```bash
soturail reverse scan ./src
soturail reverse claims ./src --with-confidence
soturail reverse specs ./src --format markdown
soturail reverse gaps
soturail reverse export --target agent
```

## Functional Stitching

The rails should connect through local IDs, not hidden state.

```txt
workflow_id
  -> run_id
  -> selected context pack
  -> selected role pack
  -> selected skills
  -> MCP exposure report
  -> policy decisions
  -> raw ids and offload ids
  -> filesystem diff
  -> harness contract result
  -> evidence pack
```

Minimum metadata for every run:

```json
{
  "schemaVersion": "soturail.run.v1",
  "runId": "run_...",
  "workflowId": "wf_...",
  "createdAt": "ISO-8601",
  "targetAgent": "claude|codex|gemini|cursor|antigravity|generic",
  "role": "planner|executor|reviewer|release-manager|researcher",
  "contextPack": "path",
  "skills": ["skill-name"],
  "rawIds": [],
  "offloadIds": [],
  "policyDecisions": [],
  "harnessContract": "path",
  "evidencePack": "path"
}
```

This makes the roadmap more functional because every future feature writes evidence into the same graph instead of creating disconnected commands.

## Acceptance Criteria For These Updates

A rail is not considered real until it has:

- CLI command or documented scaffold;
- local output path;
- dry-run or preview for risky actions;
- JSON or Markdown report format;
- clean-folder smoke test;
- Windows-safe path behavior;
- docs with example input and output;
- no unsupported benchmark or provider claim.

## What Not To Build Yet

Do not add these before the local rails mature:

- Kubernetes PVC orchestration;
- full Airflow/Leoflow clone;
- cloud gateway;
- autonomous editing runtime;
- background agents owned by SotuRail;
- production proxy claims;
- MCP tool execution without explicit local safety policy.

## Roadmap Placement

Recommended placement in the main roadmap:

```txt
v0.5.0  Add Run Workspace Rail seed, Context Budget Rail seed, MCP Exposure Rail seed and Harness Contract seed.
v0.5.1  Polish docs and generated reports for budget/exposure/workspace flows.
v0.5.2  Stabilize CI and add lightweight quality fixtures for budget, routing, evidence and payload outputs.
v0.6.0  Add Agent Runtime Adapter and host-aware capability matrix updates.
v0.6.1  Add agent UX polish and the full local evaluation suite.
v0.7.0  Expand Workflow/Harness Rail so setup/plan/work/review/release all write evidence packs.
v0.8.0  Promote Reverse Specification Rail into Knowledge Rail / Project Brain.
v1.0.0  Stabilize the Context OS contract across context, skills, MCP, policy, workspace, harness and reports.
```

## Practical Example

A future SotuRail-assisted agent task should look like this:

```bash
soturail workflow new "Add refund validation"
soturail run workspace new "Add refund validation"
soturail context route --query "refund validation" --role executor
soturail skills route --task "implement refund validation"
soturail mcp exposure --target claude
soturail harness contract check
soturail run npm test
soturail fs diff
soturail workflow verify
soturail workflow evidence <id>
```

The agent can still be Claude, Codex, Gemini or Cursor. SotuRail's job is to make the context smaller, the handoff clearer, the risk visible and the delivery auditable.
