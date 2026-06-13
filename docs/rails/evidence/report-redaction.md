# Report Redaction

Report redaction scans local status and report artifacts for obvious credential patterns before agent or CI handoff.

```bash
soturail report redact
soturail report doctor
```

Artifacts:

```txt
.soturail/reports/latest.redacted.md
.soturail/reports/latest.redacted.json
.soturail/reports/safety.json
```

Detected patterns include private key blocks, Authorization headers, Bearer tokens, GitHub tokens, npm tokens, `.env`-style secrets and common `password=`, `token=`, `secret=` and `api_key=` assignments.

Redaction is conservative. It does not redact every long path, normal package integrity hashes or ordinary commit hashes. Raw logs should still be treated as local evidence and reviewed before sharing.
