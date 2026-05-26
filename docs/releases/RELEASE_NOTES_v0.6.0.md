# SotuRail v0.6.0 - Real Agent Runtime Integration

SotuRail v0.6.0 adds a conservative host-aware Agent Runtime Adapter. SotuRail still prepares local context, rules, skills, MCP notes, role packs, policy guidance and evidence. The actual agent host still owns the model, planning loop, editing UI and runtime.

## Highlights

- `soturail agents capabilities` shows a host capability matrix.
- `soturail agents status` inspects local agent files, exports, context packs, role packs, skills, MCP exports, policy state and run workspaces.
- `soturail agents doctor --verbose` adds host-aware payload, policy and dry-run install guidance.
- `soturail agents install --agent claude --dry-run`, `cursor --dry-run` and `gemini --dry-run` preview project-local writes, backups and policy warnings.
- Experimental `deepagents` and `deepagents-js` exports create context/config artifacts only.
- Host-aware docs cover prompt-only fallback, payload formats, policy notes and generated-file review.

## Try It

```bash
soturail agents capabilities
soturail agents status
soturail agents doctor --verbose
soturail agents install --agent claude --dry-run
soturail agents install --agent cursor --dry-run
soturail agents install --agent gemini --dry-run
soturail agents export --agent deepagents
soturail agents export --agent deepagents-js
```

## Security

SotuRail remains safe-by-default. It does not write global config by default, does not expose arbitrary shell execution through MCP and creates backups before modifying existing project-local agent files.

## Not Included

v0.6.0 does not publish to npm, create a GitHub release, install Deep Agents packages, create an autonomous editing runtime or run the v0.6.1 heavy evaluation suite.
