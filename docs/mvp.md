# MVP Scope

SotuRail v0.1.0 validates the core foundation:

- local workspace creation;
- cross-platform file scanning with deny rules;
- progressive file reading;
- safe tee-stream command execution;
- raw log recovery;
- SDD artifact generation;
- Git-linked memory;
- prompt-cache-friendly block ordering;
- honest local metrics.

## Non-goals

- No telemetry.
- No remote service.
- No native compiled dependencies.
- No automatic `git push`.
- No provider cache-hit claims unless metadata is manually imported.
