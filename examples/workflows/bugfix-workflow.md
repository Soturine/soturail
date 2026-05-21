# Bugfix Workflow

```bash
soturail workflow new "Fix parser bug"
soturail workflow plan <id>
soturail context pack --target codex
soturail run npm test
soturail workflow verify <id>
```

Keep evidence local and include raw IDs in the final review notes when useful.
