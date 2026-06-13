# Agent Response Compression

`soturail format` compresses verbose AI or documentation output deterministically. It does not call an external LLM.

Modes:

- `normal` - light cleanup.
- `concise` - direct technical instructions.
- `ultra` - maximum command-focused compression.
- `review` - code-review style grouped by severity.
- `commit` - Conventional Commit suggestion.
- `debug` - symptom, cause, fix, verification and next command.
- `docs` - README/docs-oriented language.

The reducer preserves fenced code blocks, shell commands, file paths, line numbers, warnings, security notes and failure information.
