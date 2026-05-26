# Tutorial: SotuRail With Gemini CLI

Gemini CLI support uses portable prompt/context artifacts. SotuRail does not assume Claude-style hooks or host-specific runtime control.

```bash
soturail init
soturail agents status
soturail context select --query "task for Gemini"
soturail context pack --role researcher
soturail agents install --agent gemini --dry-run
soturail agents export --agent gemini
```

Use Markdown for human-readable project context, JSON for config/tool contracts and tagged blocks when long prompt boundaries matter.

Before handoff:

- run `soturail policy doctor`;
- avoid raw logs unless reviewed;
- keep secrets out of `GEMINI.md`;
- prefer links to role packs and recovery commands over pasted giant context.
