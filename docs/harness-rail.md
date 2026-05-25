# Harness Rail

Harness Rail is a planned SotuRail area for making agent-assisted development more disciplined, auditable and repeatable.

It is inspired by Claude Code harness patterns such as `setup -> plan -> work -> review -> release`, runtime guardrails, review perspectives and evidence packs. SotuRail should absorb those patterns without becoming a Claude-only plugin or a full autonomous agent runtime.

## Product Boundary

Harness Rail should keep SotuRail as the local Context OS layer:

```txt
SotuRail prepares context, policy, evidence and reports.
The agent still plans, edits, reasons and executes through its own host.
```

This means Harness Rail should focus on:

- workflow discipline;
- policy decisions;
- review evidence;
- release evidence;
- failure learning;
- local reports;
- safe handoffs between agents or roles.

## Planned Workflow Shape

The long-term workflow should support a clearer delivery loop:

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
```

These commands may be implemented as direct commands, workflow templates, or aliases over existing `workflow` subcommands. They should not hide what is happening. Each phase should write evidence into `.soturail/workflows/<id>/`.

## Review Perspectives

Harness Rail should support review perspectives as structured sections rather than vague feedback.

Possible future commands:

```bash
soturail workflow review --perspective security
soturail workflow review --perspective quality
soturail workflow review --perspective performance
soturail workflow review --perspective accessibility
soturail workflow review --all
```

Suggested default perspectives:

- **security**: secrets, injection, unsafe permissions, dangerous commands;
- **quality**: naming, duplication, maintainability, architecture drift;
- **performance**: slow paths, memory, repeated work, large payloads;
- **accessibility**: UI semantics, keyboard flow, contrast, screen-reader concerns where applicable;
- **release**: build, tests, audit, package verification, release notes.

## Evidence Pack

Every serious workflow or release should be able to produce an evidence pack.

Possible future commands:

```bash
soturail workflow evidence <id>
soturail release evidence
```

Evidence should include:

- workflow id and state;
- plan path;
- tasks path;
- verification path;
- build result;
- test result;
- audit result;
- npm pack/package verification result;
- changed files;
- raw command ids;
- offload ids;
- selected context pack;
- selected role pack;
- policy approvals/rejections;
- release notes path;
- benchmark report path when relevant.

## Harness Failure Ledger

Repeated agent mistakes should become useful local knowledge instead of chat history that disappears.

Possible future commands:

```bash
soturail harness note "agent missed Windows npm cache issue"
soturail harness list
soturail harness explain <id>
soturail harness report
soturail harness doctor
```

A failure record should track:

- task or workflow id;
- command or agent action;
- what failed;
- root cause if known;
- fix applied;
- files changed;
- whether it repeated;
- evidence path;
- prevention candidate: rule, doc, hook, memory or workflow check.

## Guardrail Relationship

Harness Rail should connect to Policy Rail. Risky actions should be explainable and reviewable before they happen.

Examples:

```txt
R01 deny sudo
R02 deny writing .env or secrets
R03 ask before rm -rf
R04 deny git push --force
R05 ask before npm publish
R06 deny --no-verify unless explicitly approved
R07 warn before direct push to main/master
R08 require evidence before release
```

## Acceptance Criteria

Harness Rail is successful only if it makes SotuRail more predictable without making it heavy.

Minimum acceptance criteria before promotion:

- docs explain the workflow clearly;
- commands remain local-first;
- dry-run or preview exists for risky actions;
- evidence is stored locally and recoverable;
- tests cover at least one clean workflow fixture;
- benchmarks/reporting distinguish token savings from quality preservation;
- no arbitrary shell execution is exposed through MCP by default.
