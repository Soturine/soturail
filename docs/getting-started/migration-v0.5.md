# Migrating From v0.4.x To v0.5.x

SotuRail v0.5.x keeps the v0.4 agent integration and Workflow Rail commands, then adds local MVP rails for memory, context intelligence, harness evidence, policy, filesystem evidence and run workspaces.

## Version Notes

- v0.4.x focused on agent exports, MCP helpers, Workflow Rail and safe scaffold polish.
- v0.5.0 adds the first Memory, Context Intelligence, Harness, Policy, Filesystem Evidence and Run Workspace seeds.
- v0.5.1 polishes the v0.5 output, docs and first-user examples. It is not a full evaluation-suite release.

If using the npm package, install the published version you intend to test. From a source checkout, run:

```bash
npm install
npm run build
node dist/cli.js --version
```

## New Local Folders

The new rails write local artifacts under `.soturail/`:

```txt
.soturail/memory/
.soturail/context/selections/
.soturail/context/offload/
.soturail/context/role-packs/
.soturail/harness/
.soturail/policy/
.soturail/fs/snapshots/
.soturail/runs/
.soturail/reports/
```

These folders are local evidence and context material. Review before sharing, and do not commit private raw logs or secrets.

## Existing v0.4 Workflows Still Work

These commands remain part of the expected flow:

```bash
soturail init
soturail agents doctor
soturail agents export --agent all
soturail mcp smoke
soturail workflow new "Task"
soturail workflow list
```

v0.5.x adds optional rails around the same workflow:

```bash
soturail memory doctor
soturail context budget --explain
soturail context pack --role planner
soturail harness doctor
soturail policy doctor
soturail run workspace new "Task"
```

## Safe Starting Flow

For a clean project:

```bash
soturail init
soturail memory remember "Decision: keep SotuRail local-first." --tag architecture --source manual
soturail memory doctor
soturail context select --query "first setup"
soturail context budget --explain
soturail context pack --role planner
soturail harness contract init
soturail policy doctor
soturail run workspace new "Try SotuRail"
```

## What Is Still Seed-Level

These areas are useful but intentionally early:

- context selection is deterministic keyword/path scoring, not embeddings;
- role packs are Markdown handoffs, not sub-agent runtimes;
- policy queue records approvals locally but does not replace human judgment;
- filesystem evidence is lightweight and local;
- structured payload validation is a small strict JSON seed;
- format comparison uses approximate local token estimates;
- Diagram Rail is documented and planned, not fully implemented.

v0.5.2 is the planned evaluation pass for deeper quality fixtures.
