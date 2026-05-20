# Benchmarks

Run:

```bash
npm run build
soturail bench prepare
soturail bench run --engine ts
soturail bench report
```

Generated reports:

- `benchmarks/results/latest.json`
- `benchmarks/reports/latest.md`

Fixtures are deterministic and generated locally. External tool comparison is optional and user-provided.
