# Gemini Hooks

Gemini prompt-only integration uses `GEMINI.md`.

The generated rules keep repository scans, progressive file reads and raw log recovery visible to Gemini CLI sessions.

Useful commands:

```bash
soturail hooks install gemini --dry-run
soturail hooks install gemini
soturail hooks uninstall gemini
soturail hooks prompt-only gemini
```

Existing `GEMINI.md` content is backed up before install. Review generated prompt rules before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.
