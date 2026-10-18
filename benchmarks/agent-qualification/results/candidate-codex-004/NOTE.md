# INVALID for comparison

- 12 of 36 runs (t09–t12, all arms) hit the Codex plan usage limit and did nothing; they are marked `invalid` and excluded by report.mjs.
- All 36 runs used a CODEX_HOME under the OS temp directory, where Codex refuses to create its helper binaries ("could not create PATH aliases"). The harness now places CODEX_HOME outside the temp dir.
- Rerun required after the quota resets and with owner approval of further Codex spend.
