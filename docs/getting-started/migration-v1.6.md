# Migration to v1.6

v1.6 is a minor release. Existing v1.5 commands, artifacts and MCP clients keep working. One behavior is intentionally stricter, a few surfaces are deprecated, and one persisted store is migrated automatically.

## Stricter: `contract verify` needs recorded evidence

`--check-passed <command>` no longer satisfies a required check by itself. A check counts only when the latest `soturail run` of exactly that command exited 0 against the current workspace:

```bash
soturail contract create <id> --title "<t>" --intent "<i>" --criterion "<c>" --check "npm test" --criterion-check "npm test"
# implement the change, then record the check against the current workspace
soturail run -- npm test
soturail contract verify .soturail/contracts/<id>.json
```

The verdict now includes `checkEvidence` (`current-pass`, `current-fail`, `stale`, `missing`), `assertions` and `details[]` reason codes. An uncorroborated `--check-passed` is reported as `check_asserted_without_evidence`. This closes a path where an agent could reach `ready` by asserting.

## Stricter: caller flags are assertions; contracts track a baseline

- `contract verify` no longer reports `workspace_stale` just because the workspace changed since the contract was created: the contract fingerprint is a baseline, and readiness evaluates the current workspace.
- `--criterion-passed`, `--runtime-evidence`, `--independent-review` and `--human-approved` no longer satisfy readiness. Use `contract create --criterion-check <cmd>` / `--runtime-check <cmd>` for objective proof, or `soturail contract attest` from an interactive terminal for human approval, independent review and manual criteria.
- Editing a contract file after creation, changing a declared `--source`, or changing files outside `--scope` requires `soturail contract revise <file> --reason <text>`; the original file is kept.
- v1.5 contracts without `foundationDigest` are reported with integrity `legacy` and are evaluated against current evidence.

## Fixed: fingerprint missed edits to an already-modified file

Editing a tracked file that was already modified left the workspace fingerprint unchanged (the first porcelain status entry was misparsed), so evidence could look current after the edit. Evidence recorded before upgrading may now report stale; re-run the checks.

## Automatic: approved memory has one store

On first read, SotuRail copies approvals that exist only in the legacy `memory/memory.jsonl` log into `memory/approved.jsonl`, verifies the result and writes `.soturail/migrations/memory-approved-canonical-v1.6.json`. The legacy log is kept. Afterwards:

- context packs and cache payloads list each approved memory once;
- entries marked stale (`soturail memory stale`) are omitted from context packs, with a count of what was omitted;
- `memory approve` no longer mirrors into `memory.jsonl`; `memory search` still finds approved entries.

Cache-payload digests change once because duplicates disappear.

## New: Skills for agents

Bundled portable skills (`soturail-core`, `-change`, `-debug`, `-review`, `-security`, `-research`, `-knowledge`, `-release`) ship in the package. Project them into a host:

```bash
soturail skills export --target claude --layout portable --install   # .claude/skills/
soturail skills export --target codex --layout portable --install    # .agents/skills/
```

Hosts with MCP can instead call `soturail.skills.list` and `soturail.capabilities`. See the [v1.6 commands](../reference/commands/v1.6-commands.md).

## Migrating v1.5 skill packs

`.soturail/skills/<id>/` packs are still read. To move one to the portable layout without touching it:

```bash
soturail skills migrate <id>
soturail skills discover          # the old pack now reports legacy_superseded
```

Remove the old pack after review.

## Deprecated (removal target v2.0.0)

| Deprecated | Use instead |
|---|---|
| `skills export --layout flat` (default) | `--layout portable` |
| host ID `gemini-legacy` | `gemini` |
| authoring new v1.5 packs (`skills init`, `template`, `build`) | portable `.agents/skills/<name>/SKILL.md`, `skills migrate` |
| legacy MCP negotiation (`2024-11-05`) | MCP `2026-07-28` via the official SDK |

## Other changes to review

- Machine slugs keep ASCII output unchanged; names with accents now fold (`Revisão` → `revisao`) and non-Latin names get a short digest instead of collapsing to `skill`, `topic` or `rule`. Lookups by a previously lossy slug may need the new ID.
- `agents export` no longer recommends `soturail brain export --agent antigravity` (that command was always rejected); it recommends `generic`.
- `skills suggest` / `skills route` / `context select` print `heuristic-fallback` labels; use `context select --expert/--role` to declare routing explicitly.
- Candidate freshness and evidence freshness assume `.soturail/` is git-ignored, as `soturail init` configures.

See the [legacy removal report](../audits/v1.6.0-legacy-removal-report.md) for everything removed, migrated, deprecated or retained.
