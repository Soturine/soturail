# Codex Hooks

Codex prompt-only integration uses `AGENTS.md`.

SotuRail does not assume private Codex host hook APIs. The fallback rules describe when to index, read progressively, run through SotuRail and avoid `git push`.

Useful commands:

```bash
soturail hooks install --agent codex --mode prompt-only --dry-run
soturail hooks install --agent codex --mode prompt-only
soturail hooks uninstall --agent codex
soturail hooks export --agent codex
soturail hooks prompt-only codex
```

Existing `AGENTS.md` content is backed up before install. Review generated prompt rules before enabling them. SotuRail should never auto-install unreviewed third-party skills, hooks or scripts.
