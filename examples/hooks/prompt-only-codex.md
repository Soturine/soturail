# Prompt-only Codex Rules

- Use `soturail index` before large repository changes.
- Use `soturail read <file> --query "goal"` instead of reading giant files directly.
- Use `soturail run` for tests, builds and logs so raw output is recoverable.
- Use `soturail expand <raw_id>` only when the compressed summary lacks needed information.
- Never use `soturail run` for `git push`.
