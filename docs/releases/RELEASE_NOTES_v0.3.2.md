# SotuRail v0.3.2 - Strong Reducers, Deduplication & Package Verification

SotuRail v0.3.2 strengthens the core reducer/deduplication layer and adds package verification gates to prevent stale CLI metadata from being published.

## Highlights

- Stronger reducers for common developer outputs.
- Block-level dedupe.
- Improved `soturail dedupe` stats.
- Improved `soturail stats` accounting.
- Safer `soturail expand` with default secret redaction.
- Expanded benchmark cases.
- Release verification now installs the packed tarball in a clean temporary folder before publish.

## Install

```bash
npm install -g soturail@0.3.2
soturail --version
```

## Validate

```bash
soturail run npm test
soturail dedupe stats
soturail stats
soturail bench
```

## Security

Raw logs may contain secrets. `soturail expand` redacts probable secrets by default.
