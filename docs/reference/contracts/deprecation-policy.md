# Deprecation Policy

SotuRail v1.0.0 treats command and schema stability as a first-class release concern.

## Policy

- Stable commands should not be removed without notice.
- Experimental commands can change, but docs and release notes must say so.
- Schema v1 artifacts should maintain compatibility when possible.
- Breaking schema changes require release-note warnings and migration guidance.
- Deprecated commands should print or document replacement guidance.
- v1.0 freezes only the documented stable command surface.

## Stable Commands

Commands listed in [stable-command-surface.md](../commands/stable-command-surface.md) are the v1.0 stable surface. Compatible additions are allowed. Removals, meaning changes or output-shape breaks require a warning period and migration notes.

## Experimental Commands

Experimental commands include graph/parse seeds, native acceleration beyond reports, dashboard server ideas and extended MCP mutation tools. These can change until promoted while SotuRail keeps TypeScript fallback, local artifacts and safe defaults.

## Schema Compatibility

Use:

```bash
soturail self schemas --check
soturail self schemas --check --json
soturail self schemas --check --strict
```

The schema checker validates local JSON artifacts for parseability, `schemaVersion` and required top-level fields.

## Release Notes

Every release that deprecates, replaces or breaks a command or schema must call it out in `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.
