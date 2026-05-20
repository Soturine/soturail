# AGENTS.md

Guidance for AI coding agents working inside a SotuRail-enabled repository.

- Use `soturail index` before asking the model to reason about the whole repository.
- Use `soturail read <file> --query "goal"` instead of dumping large files.
- Use `soturail run <command...>` so raw logs remain recoverable.
- Use `soturail expand <raw_id>` whenever the compressed summary is insufficient.
- Do not run `git push` automatically.
- Treat token and cache metrics as estimates unless provider metadata was imported.
