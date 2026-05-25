# Agent Docs Hygiene

Agent Docs Hygiene is the planned SotuRail area for keeping root agent instruction files short, current and useful.

The main idea:

```txt
Root agent docs should route context.
They should not become huge project wikis.
```

## Target Files

SotuRail should eventually inspect files such as:

- `CLAUDE.md`
- `AGENTS.md`
- `GEMINI.md`
- `.cursor/rules/*`
- `agent_docs/*`
- `.soturail/context/*`

## Planned Commands

Possible future commands:

```bash
soturail agents lint
soturail agents docs doctor
soturail agents docs split
soturail agents docs suggest
soturail agents explain-context
```

## What To Check

Agent docs linting should warn about:

- root instruction files that are too long;
- repeated or conflicting rules;
- stale commands;
- missing build/test/release commands;
- missing project purpose;
- missing safety rules;
- probable secrets;
- too much generic advice;
- unclear module ownership;
- dead links to docs that do not exist;
- large docs that should be referenced instead of pasted.

## Recommended Shape

A healthy setup should look like this:

```txt
CLAUDE.md or AGENTS.md
  -> short project purpose
  -> safe commands
  -> important rules
  -> links to larger docs

agent_docs/
  -> detailed workflows
  -> architecture notes
  -> testing policy
  -> release policy

.soturail/context/
  -> generated target-aware context packs
```

## Relationship With Context Packs

Agent docs should point to SotuRail context packs instead of copying every detail.

Example future flow:

```bash
soturail agents lint
soturail context select --query "prepare npm release"
soturail context pack --role release-manager
soturail agents export --agent claude
```

## Acceptance Criteria

Agent Docs Hygiene should not be promoted until:

- lint output is actionable;
- docs are not rewritten without dry-run or backup;
- host differences are documented;
- generated suggestions stay local;
- probable secrets are warned about;
- tests cover at least `CLAUDE.md`, `AGENTS.md` and Cursor-style rules.
