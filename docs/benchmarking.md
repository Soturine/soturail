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

The suite includes terminal reducers, agent response compression and Knowledge-to-Rules extraction. Optional RTK or Squeez comparisons are only run when the user already has those tools on PATH.
