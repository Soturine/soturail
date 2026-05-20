# Security Policy

SotuRail is local-first and does not implement telemetry.

## Command Safety

`soturail run` blocks dangerous command patterns by default, including recursive deletion, privilege escalation, disk formatting, raw disk copy, downloaded script piping, recursive Windows deletion and `git push`.

Unsafe bypass requires the exact confirmation phrase shown by the CLI.

## Reporting Security Issues

Please avoid public proof-of-concept exploit details before maintainers have had time to respond. Open a private advisory or contact the maintainer with:

- affected version;
- reproduction steps;
- expected impact;
- suggested mitigation if known.
