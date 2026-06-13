# Media Guide

SotuRail media assets are local documentation artifacts. They should show the CLI, reports, dashboard and host exports without exposing private paths, secrets or live tokens.

## Folders

```txt
docs/assets/screenshots/
docs/assets/demos/
```

## Rules

- Use generated or sanitized screenshots.
- Do not include real tokens, emails, private paths or `.env` data.
- Do not show `.soturail/raw` evidence.
- Prefer small SVG or PNG assets that can be committed safely.
- Keep animated demos short and local; do not rely on external CDNs.

## Suggested Shots

- `status-json.svg`: valid JSON status output.
- `agents-matrix.svg`: host compatibility matrix summary.
- `host-doctor.svg`: per-host doctor result.
- `dashboard.svg`: static dashboard overview.

Media is illustrative evidence, not a replacement for tests or release checks.
