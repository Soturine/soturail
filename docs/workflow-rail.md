# Workflow Rail

Workflow Rail is a local task state system for SotuRail. It stores auditable workflow artifacts under `.soturail/workflows/` and can optionally plan or create local Git worktrees.

```bash
soturail workflow new "Implement feature"
soturail workflow list
soturail workflow show <id>
soturail workflow plan <id>
soturail workflow start <id> --worktree --dry-run
soturail workflow status <id>
soturail workflow verify <id>
soturail workflow evidence <id>
soturail workflow close <id>
soturail workflow cleanup --closed --dry-run
```

## State Machine

Workflows use explicit states:

- `draft`
- `planned`
- `active`
- `verifying`
- `ready_for_review`
- `closed`
- `blocked`

## Storage

Each workflow uses:

```txt
.soturail/workflows/<id>/
├── workflow.yml
├── plan.md
├── tasks.md
├── verification.md
└── logs/
```

## Worktrees

`soturail workflow start <id> --worktree --dry-run` prints a local worktree plan. If run without `--dry-run` inside a Git repository, SotuRail may create a local worktree under `.soturail/worktrees/<id>/`.

Safety rules:

- SotuRail does not push.
- SotuRail does not merge.
- SotuRail does not delete user work without explicit confirmation.
- Rollback instructions are printed when worktrees are planned.

## Verification

`soturail workflow verify <id>` only runs configured safe checks when they are explicit. Without configured checks, it prints a checklist instead of inventing commands.

Future verification should also connect workflow evidence to:

- selected context pack;
- selected role pack;
- commands that ran;
- raw IDs and offload IDs;
- filesystem snapshots and touched files;
- memory recall records;
- policy approvals or rejections.

## Evidence

`soturail workflow evidence <id>` writes a local Markdown evidence pack under `.soturail/reports/`.

The v0.5.0 seed includes workflow paths, recent raw IDs, policy decisions, harness failures and filesystem evidence pointers where available. It does not claim that build, test or audit passed unless those results exist as local evidence.

## Cleanup

`soturail workflow cleanup --closed --dry-run` previews closed workflow records that could be removed. It does not delete anything unless rerun with `--closed --yes` after review.

## Harness-Style Workflow Direction

Harness-style development reinforces a simple delivery loop:

```txt
setup -> plan -> work -> review -> release
```

SotuRail should absorb this as local workflow evidence, not as a Claude-only plugin or a full agent runtime.

Possible future commands or templates:

```bash
soturail workflow setup
soturail workflow plan
soturail workflow work
soturail workflow review
soturail workflow release
soturail workflow evidence <id>
```

Review should be perspective-aware:

```bash
soturail workflow review --perspective security
soturail workflow review --perspective quality
soturail workflow review --perspective performance
soturail workflow review --perspective accessibility
soturail workflow review --all
```

The review output should eventually write a stable `review.md` or evidence section with:

- security findings;
- quality findings;
- performance findings;
- accessibility findings when relevant;
- release-readiness findings;
- commands and raw IDs used as evidence.

See also [harness-rail.md](harness-rail.md).

## Diagram-Driven Workflow Direction

Diagram Rail adds visual contracts to Workflow Rail. The target flow is:

```txt
Idea -> PRD -> Diagram -> Tasks -> TDD -> Work -> Review -> Release -> Evidence
```

Possible future commands:

```bash
soturail workflow diagram <id>
soturail diagram from-workflow <id>
soturail diagram validate
```

Useful workflow diagrams:

- state machine for the current workflow;
- release pipeline;
- policy approval flow;
- agent context handoff;
- failure recovery path;
- context router decision path.

A diagram should not replace tests or review. It should make state transitions and constraints explicit before the agent implements code.

See also [diagram-rail.md](diagram-rail.md).

## Future Workflow Rail 2.0

The v0.7 roadmap turns Workflow Rail into a stronger `Idea -> PRD -> Tasks -> TDD -> Implementation -> Review -> Release` system.

Planned commands:

```bash
soturail workflow scaffold --type feature
soturail workflow scaffold --type bugfix
soturail workflow scaffold --type release
soturail workflow plan <id>
soturail workflow tasks <id>
soturail workflow tdd <id>
soturail workflow trace <id>
soturail workflow report <id>
```

## Future Role-Based Phases

Deep Agents-style harnesses validate the idea of specialized sub-agents. SotuRail should keep this as local workflow evidence and role context, not as a required runtime.

Suggested workflow phases:

- **Planner**: reads roadmap, PRD, specs, constraints and previous decisions.
- **Executor**: reads target source files, task notes, failing tests and safe command guidance.
- **Reviewer**: reads diffs, tests, rules, security notes and acceptance criteria.
- **Release manager**: reads package version, changelog, release notes, audit/build/test/pack evidence and npm/GitHub state.
- **Researcher**: reads docs, citations, ecosystem notes and comparison constraints.

Future role-aware workflow commands can attach context packs to workflow phases:

```bash
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
```

## Future Evidence Pack Model

Each workflow or release should eventually be able to produce an evidence pack with:

- workflow id and state;
- plan path;
- tasks path;
- verification path;
- diagram path when available;
- build result;
- test result;
- audit result;
- package verification result;
- changed files;
- raw command IDs;
- offload IDs;
- selected context pack;
- selected role pack;
- policy approvals or rejections;
- release notes path;
- benchmark report path when relevant.

## Future Trace And Evidence Model

Each workflow phase should eventually be able to show:

```txt
phase: reviewer
role_pack: .soturail/context/reviewer-context.md
skills: code-review, bug-triage
commands: npm test, npm run build
raw_ids: raw_...
offload_ids: offload_...
filesystem_snapshot: snapshot_...
policy_decisions: approved/rejected/pending
result: pass/fail/blocked
```

This keeps SotuRail useful for sub-agent-style workflows while staying independent from LangChain, LangGraph, Deep Agents, CrewAI or any specific agent runtime.
