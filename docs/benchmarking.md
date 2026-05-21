# Benchmarking

SotuRail benchmarks use deterministic local fixtures. They are intended to make reducer and context behavior measurable without claiming external superiority.

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench report
```

Outputs:

- `benchmarks/results/latest.json`
- `benchmarks/reports/latest.md`

The suite groups results as:

- terminal reducer compression;
- agent response compression;
- knowledge structuring;
- cache stability;
- native engine availability/performance when available;
- skill rail validation/export;
- MCP resource listing/reading;
- context pack generation;
- agent hook export;
- memory approval workflow.

Terminal reducer cases include npm install noise, npm test success, Vitest failures, TypeScript diagnostics, git diff/status noise, Docker logs, ESLint failures, Vite/Next build output, Java stack traces, Maven/Gradle failures, JSON/tool payload output, tiny-output overhead and dedupe fixtures.

Each v0.3.2 reducer case reports:

- `raw_tokens`;
- `reduced_tokens`;
- `dedupe_tokens_saved`;
- `metadata_overhead_tokens`;
- `net_tokens_saved`;
- `quality_passed`;
- preserved errors, paths and commands.

Knowledge-to-Rules is not judged as pure compression. It creates reusable structured rules, citations and validator metadata.

Native comparison:

```bash
soturail bench run --engine native
soturail bench compare-engines
```

Optional RTK or Squeez comparisons are only run when the user already has those tools on PATH.
