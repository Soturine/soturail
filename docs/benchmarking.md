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

- terminal compression;
- agent response compression;
- JSON/tool payload compression;
- knowledge structuring;
- native performance when available.

Knowledge-to-Rules is not judged as pure compression. It creates reusable structured rules, citations and validator metadata.

Native comparison:

```bash
soturail bench run --engine native
soturail bench compare-engines
```

Optional RTK or Squeez comparisons are only run when the user already has those tools on PATH.
