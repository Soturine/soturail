# Tutorial: Deep Agents-Style Role Packs

SotuRail can export role packs and policy notes for Deep Agents-style hosts, but it does not run a Deep Agents runtime or install deepagents packages.

```bash
soturail init
soturail context pack --role planner
soturail context pack --role executor
soturail context pack --role reviewer
soturail context pack --role release-manager
soturail context pack --role researcher
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
soturail agents export --agent deepagents --role reviewer
soturail agents doctor --host deepagents
```

Use role packs as reviewed context boundaries:

- planner gets roadmap/specs/decisions;
- executor gets task/files/tests;
- reviewer gets diffs/tests/security notes;
- release-manager gets version/changelog/release evidence;
- researcher gets docs/ecosystem constraints.

Keep risky actions in SotuRail policy queues and keep raw evidence recoverable by ID.

v1.1 exports write `role-pack.md` and `subagents.md` under `.soturail/agents/deepagents/`. These files are prompt/context artifacts only; they are not a runtime registration file and do not install Deep Agents dependencies.
