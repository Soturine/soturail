# Security Policy

SotuRail is local-first and does not implement telemetry.

## Destructive Command Blocking

`soturail run` blocks dangerous command patterns by default:

- `rm -rf`
- `sudo`
- `format`
- `dd if=`
- `curl | sh`
- `wget | sh`
- `del /s`
- `git push`

Unsafe bypass requires the exact confirmation phrase printed by the CLI.

## Remote Pushes

SotuRail's safe runner blocks `git push`. Repository publishing should use normal Git or GitHub CLI intentionally, outside `soturail run`.

## Raw Logs May Contain Secrets

Raw logs preserve terminal output for auditability. They may include tokens, secrets, private paths or customer data. Do not commit `.soturail/raw/`, and scrub logs before sharing.

## Reporting Vulnerabilities

Please report security issues with:

- affected version;
- OS and shell;
- reproduction steps;
- security impact;
- raw_id only if the raw log is safe to share.
