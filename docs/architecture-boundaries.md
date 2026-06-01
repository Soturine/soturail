# Architecture Boundaries

SotuRail v1.0.0 keeps architecture checks lightweight and deterministic.

```bash
soturail self architecture --check
soturail self architecture --check --json
```

## Rules

- Commands parse options and dispatch output.
- Core modules own domain behavior and storage logic.
- Core modules should not import `commander` or command modules.
- Report, dashboard, schema, release and Project Brain code should prefer reusable core helpers over CLI-only logic.
- Experimental rails must be marked experimental until promoted.
- Native paths remain optional; TypeScript fallback must keep working.

## Why This Exists

The v1 stable surface is broad enough that accidental coupling would make future releases harder. Architecture checks surface the risks early without blocking normal development for warnings.
