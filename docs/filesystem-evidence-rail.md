# Filesystem Evidence Rail

Filesystem Evidence Rail is the SotuRail area for recording what changed locally during a workflow without becoming an editing agent.

The goal is to make file changes auditable for humans and agents.

## Product Boundary

SotuRail should not silently edit, push, merge or delete user work.

Filesystem Evidence Rail should provide:

- snapshots;
- touched-file lists;
- diff summaries;
- workflow links;
- raw command links;
- policy links;
- evidence reports.

It should not replace Git, code review or backups.

## v0.5.0 Seed Commands

```bash
soturail fs snapshot
soturail fs touched
soturail fs diff
soturail fs plan-edit "describe intended edit"
```

Snapshots are written under `.soturail/fs/snapshots/`. `plan-edit` writes an intent note and does not modify project files.

Possible workflow integration:

```bash
soturail workflow start <id> --snapshot
soturail workflow verify <id> --include-fs
soturail workflow evidence <id>
```

## Snapshot Record

A snapshot should include:

```txt
snapshot_id
workflow_id
created_at
git_commit
branch
worktree_path
files_hash
ignored_paths
tracked_files_count
untracked_files_count
```

## Touched Files

Touched-file summaries should include:

- path;
- status: added/modified/deleted/renamed/untracked;
- line count delta when available;
- whether file appears sensitive;
- whether file is generated;
- whether file is ignored;
- related raw IDs or commands.

## Diff Summaries

Diff summaries should preserve:

- file paths;
- changed symbols when detectable;
- important hunks;
- test changes;
- config changes;
- dependency changes;
- docs changes;
- generated-file warnings;
- possible secret additions.

Diff summaries should not pretend to be full diffs. They should link back to Git or local raw evidence.

## Relationship With Workflow Rail

Filesystem Evidence Rail should attach to workflow phases:

```txt
plan -> snapshot before work
work -> touched files and command raw IDs
review -> diff summary and review perspectives
release -> evidence pack with build/test/audit/pack status
```

## Relationship With Policy Rail

Policy Rail should inspect filesystem evidence for risky changes:

- `.env` or secret files;
- package manager lockfiles;
- CI workflows;
- release scripts;
- agent host config files;
- MCP config files;
- security-sensitive settings.

## Acceptance Criteria

Filesystem Evidence Rail should not be promoted until:

- it never deletes files by default;
- it never pushes or merges;
- sensitive files are flagged;
- snapshots are tied to workflow IDs where possible;
- diff summaries preserve paths and key hunks;
- reports clearly distinguish summary from full diff.
