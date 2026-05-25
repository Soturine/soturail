# Deep Agents Pattern Notes

This document records what SotuRail can learn from Deep Agents-style agent harnesses without becoming a LangChain, LangGraph or Deep Agents clone.

## Core Distinction

```txt
Deep Agents-style harness = the agent that plans, delegates, calls tools and executes.
SotuRail = the local rail layer that prepares context, memory, logs, policies, workflow evidence and recovery paths for any agent.
```

SotuRail should stay model-agnostic, host-agnostic, local-first and safe-by-default.

## Patterns Worth Absorbing

### 1. Role-Based Context Packs

Deep agent systems use sub-agents with isolated context windows. SotuRail can turn that into role-based context packs without running the agent itself.

Future direction:

```bash
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
```

Suggested roles:

- **Planner**: roadmap, PRD, specs, architecture notes, accepted constraints.
- **Executor**: task file, target source files, repo map, failing test output, safe commands.
- **Reviewer**: diff summary, tests, rules, acceptance criteria, security notes.
- **Release manager**: version, changelog, release notes, package verification, npm/GitHub state.
- **Researcher**: docs, external notes, citations and comparison constraints.

### 2. Context Offload And Restore

Long tool outputs should not be pasted into every prompt. SotuRail already stores raw logs and reducer summaries; this can become an explicit context offload rail.

Future direction:

```bash
soturail context offload <raw_id>
soturail context restore <offload_id>
soturail trace attach-raw <raw_id>
```

The agent should receive:

```txt
summary + important paths + failure lines + raw_id recovery pointer
```

Instead of receiving every raw terminal line.

### 3. Filesystem Evidence Without Becoming An Editing Agent

Deep agent systems often read, write, edit and search the filesystem. SotuRail should not become the editing agent. It should create auditable filesystem evidence around agent work.

Future direction:

```bash
soturail fs snapshot
soturail fs diff
soturail fs touched
soturail fs plan-edit
```

Purpose:

- show which files changed;
- connect changes to workflow IDs;
- connect raw logs and command output to the files touched;
- help reviewers and agents recover context without scanning the whole repo.

### 4. Human-In-The-Loop Approval Queue

Deep agent systems can ask humans to approve, edit or reject tool calls. SotuRail can apply the same idea locally to risky commands, exports and raw expansion.

Future direction:

```bash
soturail policy queue
soturail policy approve <id>
soturail policy reject <id>
soturail policy explain <id>
```

Examples of actions that should be explainable and reviewable:

- npm publish;
- GitHub release creation;
- global agent config writes;
- raw log expansion without redaction;
- destructive filesystem commands;
- MCP tool exposure changes.

### 5. Skills Loaded By Task

Deep agent systems use reusable skills that can be loaded on demand. SotuRail already has Skill Rail, so the next step is skill routing.

Future direction:

```bash
soturail skills suggest --query "publish npm release"
soturail skills route --task "fix failing test"
soturail skills export --role reviewer
```

Output should explain:

- which skill was selected;
- why it was selected;
- what context pack should accompany it;
- which policy checks apply.

### 6. Deep Agents As A Future Export Target

SotuRail should not depend on Deep Agents, but it can eventually export files that are useful for Deep Agents or deepagents-js projects.

Future direction:

```bash
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
```

Possible outputs:

```txt
.soturail/exports/agents/deepagents/context-pack.md
.soturail/exports/agents/deepagents/skills.md
.soturail/exports/agents/deepagents/mcp-config.json
.soturail/exports/agents/deepagents/policy.md
.soturail/exports/agents/deepagents/role-packs/
```

This should remain prompt/config/context export only unless a stable, safe integration surface is reviewed.

## What SotuRail Should Not Do

SotuRail should not become:

- a LangChain clone;
- a LangGraph clone;
- a Deep Agents clone;
- a CrewAI-style framework;
- a full autonomous agent runtime;
- a shell-execution MCP gateway by default.

## Best Fit In The Roadmap

```txt
v0.5.x
- context offload
- memory recall
- context routing by role
- policy approval queue
- agent docs lint

v0.6.x
- deepagents/deepagents-js as experimental export targets
- agent capability matrix entries
- skill export by role

v0.7.x
- Workflow Rail 2.0 with planner/executor/reviewer/release-manager phases
- sub-agent context packs
- trace per workflow phase

v0.10.x
- local dashboard for traces, approvals, role packs and context used
```

## Product Rule

Deep Agents validates the need for sub-agents, filesystem, memory, context management, human approval, skills and tools. SotuRail should provide the local evidence rails and context hygiene around those systems, not replace them.
