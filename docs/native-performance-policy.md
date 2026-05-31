# Native Performance Policy

SotuRail native acceleration is benchmark-gated.

```txt
No benchmark, no native rewrite.
```

TypeScript remains the portable baseline and the default safe fallback. Normal npm installs must not require Rust, Cargo, native build tools, prebuilt platform packages or a working native binary.

## Decision Policy

Native acceleration is allowed only when:

1. A benchmark exists for the operation.
2. A TypeScript baseline is recorded.
3. The native path is optional.
4. The fallback path is tested.
5. The speedup justifies the maintenance risk.
6. npm install stays safe for normal users.

Decision statuses:

```txt
not-measured
measured
candidate
approved-for-native
native-implemented
rejected
```

## Current Candidate Flow

```bash
soturail bench list
soturail bench run --suite brain
soturail native candidates
soturail native status
soturail native doctor
soturail native compare
```

`native candidates` classifies operations as:

- `good-candidate`
- `maybe-candidate`
- `not-worth-it-yet`
- `blocked`

Candidate reports are written to:

```txt
.soturail/native/candidates.json
.soturail/native/candidates.md
```

## Required Boundary

SotuRail does not claim native speedups unless a local benchmark report proves them.

Native acceleration is optional. TypeScript remains the portable baseline.
