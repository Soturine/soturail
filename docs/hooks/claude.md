# Claude Hooks

SotuRail v0.2.1 includes a conservative Claude Code hook template.

```bash
soturail hooks install claude --dry-run
soturail hooks install claude
soturail hooks uninstall claude
soturail hooks prompt-only claude
```

Generated files:

- `.claude/settings.json`
- `.claude/hooks/soturail-pre-tool-use.js`
- `.claude/hooks/soturail-post-tool-use.js`

Existing files are backed up with `.soturail.bak` before being changed.

The pre-tool hook inspects incoming tool payload text when Claude Code provides it. It blocks obvious destructive shell commands, including recursive deletion, `sudo`, `git push`, downloaded script piping and raw disk copy patterns. It also suggests `soturail run` for tests, builds and logs.

The hook never routes `git push` through `soturail run`.

Review generated settings and scripts before relying on them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.

## Limitation

Claude Code hook schemas may vary by installed version. SotuRail writes a conservative documented template; if your Claude Code release expects a different schema, copy the generated command into the supported hook slot manually.
