# Evaluation Suite

Evaluation Suite is the planned SotuRail area for proving that context reduction and routing preserve useful information.

The goal is not only to show token savings. The goal is to show that an agent still receives the right evidence to solve the task.

## Product Boundary

SotuRail benchmarks should stay local, deterministic and reproducible by default.

They should not require paid API calls, private provider telemetry or external services.

Optional external comparisons may exist only when the user supplies the tools and accepts the caveats.

## Planned Commands

```bash
soturail bench prepare
soturail bench run --engine ts
soturail bench run --suite evaluation
soturail bench report
soturail bench compare-engines
soturail eval run
soturail eval report
```

The final CLI shape can remain under `bench` or introduce `eval`; the docs should make clear that quality and evidence preservation matter.

## Evaluation Dimensions

The suite should measure:

- raw token estimate;
- reduced token estimate;
- metadata overhead;
- net token savings;
- quality pass/fail;
- critical lines preserved;
- path preservation;
- command preservation;
- error/warning preservation;
- source line/range preservation;
- raw/offload recovery pointer preservation;
- policy decision preservation.

## Planned Fixture Groups

### 1. Terminal Reducer Quality

Fixtures:

- npm install noise;
- npm test success/failure;
- Vitest failure;
- TypeScript diagnostics;
- Java stack trace;
- Maven/Gradle failure;
- Docker logs;
- ESLint failure;
- Vite/Next build;
- git diff/status noise;
- JSON/tool payload output;
- tiny-output overhead.

Quality checks:

- root error preserved;
- file path preserved;
- line/column preserved;
- command preserved;
- raw recovery hint preserved.

### 2. Context Selection Quality

Fixtures should ask task-like queries and expect the right source set.

Examples:

```txt
query: fix npm publish on Windows
expected: release docs, Windows notes, package verification notes

query: add MCP read-only resource
expected: MCP docs, security model, policy rail notes
```

Quality checks:

- expected docs included;
- unrelated docs mostly omitted;
- reasons are present;
- line ranges or source paths are present.

### 3. Memory Recall Quality

Fixtures:

- approved decision;
- stale decision;
- conflicting decisions;
- sensitive memory;
- repeated bug memory;
- release policy memory.

Quality checks:

- approved records can be recalled;
- stale/conflict status is visible;
- rejected records are not exported by default;
- probable secrets are redacted.

### 4. Role-Pack Quality

Fixtures:

- planner pack;
- executor pack;
- reviewer pack;
- release-manager pack;
- researcher pack.

Quality checks:

- planner receives roadmap/specs, not raw terminal noise by default;
- executor receives task/files/tests;
- reviewer receives diff/tests/rules/security notes;
- release-manager receives version/changelog/audit/pack/npm/GitHub state;
- researcher receives ecosystem notes and comparison caveats.

### 5. Structured Payload Quality

Compare formats:

- Markdown;
- JSON;
- XML-like tagged context;
- TOON/table-like compact output;
- Mermaid where visual context applies.

Quality checks:

- critical facts preserved;
- schema or syntax valid where applicable;
- duplicate JSON keys detected;
- token estimate reported;
- recommended target format explained.

### 6. Diagram Validation Quality

Fixtures:

- valid workflow Mermaid;
- invalid Mermaid syntax;
- unreachable state;
- missing start/end;
- release path without test/audit/pack evidence;
- policy flow without approve/reject state.

Quality checks:

- invalid diagrams fail clearly;
- validation message points to the missing state/edge;
- diagrams are not treated as tests.

### 7. Evidence Pack Completeness

Fixtures:

- workflow evidence;
- release evidence;
- failed command evidence;
- policy approval evidence;
- offloaded raw output evidence.

Quality checks:

- build/test/audit/pack status present where expected;
- raw IDs present;
- changed files present;
- policy decisions present;
- release notes path present for release workflows;
- missing evidence is reported honestly.

### 8. Harness Scenario Quality

Fixtures:

- repeated agent mistake;
- stale instruction file;
- unsafe command request;
- missing release verification;
- broken Windows/npm cache assumption.

Quality checks:

- failure becomes candidate memory/rule/doc/workflow check;
- repeated failures are grouped;
- prevention suggestion is concrete.

## Reporting

Reports should include:

```txt
suite
fixture_count
passed
failed
raw_tokens
reduced_tokens
metadata_overhead
net_tokens_saved
quality_passed
critical_facts_preserved
recovery_paths_preserved
platform
node_version
engine
native_fallback_status
```

## Acceptance Criteria

Evaluation Suite should not be promoted until:

- fixtures are deterministic;
- no external API is required;
- failures are readable;
- token savings and quality are separated;
- benchmark reports are committed only when intentionally refreshed;
- public claims match reproducible local results.
