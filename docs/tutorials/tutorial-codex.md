# Tutorial: SotuRail With Codex

Codex support is conservative and prompt-first. Use `AGENTS.md`, context packs and role packs. Do not assume unsupported hooks or global config writes.

```bash
soturail init
soturail agents status
soturail agents capabilities
soturail context budget --explain
soturail context pack --role executor
soturail agents install --agent codex --dry-run
soturail agents export --agent codex
```

Use `soturail eval run` before release or large changes to check that local fixtures still preserve critical evidence.

Keep `AGENTS.md` short and point to:

- `.soturail/context/` for selected context;
- `.soturail/context/role-packs/` for task role context;
- `.soturail/reports/` and `.soturail/eval/` for evidence;
- `docs/rails/governance/policy-rail.md` for risky actions.
