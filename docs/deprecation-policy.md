# Deprecation Policy

SotuRail is still pre-v1.0, but v0.10.1 starts treating command and schema stability as a first-class release concern.

## Policy

- Stable commands should not be removed without notice.
- Experimental commands can change, but docs and release notes must say so.
- Schema v1 artifacts should maintain compatibility when possible.
- Breaking schema changes require release-note warnings and migration guidance.
- Deprecated commands should print or document replacement guidance.
- v1.0 will freeze only the documented stable command surface.

## Stable Commands

Commands listed in [stable-command-surface.md](stable-command-surface.md) are candidate stable commands. They are not fully frozen until v1.0, but v0.10.x changes should avoid breaking them.

## Experimental Commands

Experimental commands include graph/parse seeds, native acceleration beyond reports and extended MCP tools. These can change before v1.0 while SotuRail keeps TypeScript fallback, local artifacts and safe defaults.

## Schema Compatibility

Use:

```bash
soturail self schemas --check
soturail self schemas --check --json
```

The schema checker validates local JSON artifacts for parseability, `schemaVersion` and required top-level fields.

## Release Notes

Every release that deprecates, replaces or breaks a command or schema must call it out in `docs/releases/RELEASE_NOTES_vX.Y.Z.md`.
