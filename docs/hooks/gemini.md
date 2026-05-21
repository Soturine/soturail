# Gemini Hooks

Gemini prompt-only integration uses `GEMINI.md`.

The generated rules keep repository scans, progressive file reads and raw log recovery visible to Gemini CLI sessions.

Useful commands:

```bash
soturail hooks install --agent gemini --mode prompt-only --dry-run
soturail hooks install --agent gemini --mode prompt-only
soturail hooks uninstall --agent gemini
soturail hooks export --agent gemini
soturail hooks prompt-only gemini
```

Existing `GEMINI.md` content is backed up before install. Review generated prompt rules before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.
