# CLAUDE.md

Claude Code should treat SotuRail outputs as scoped context rails.

Recommended loop:

1. `soturail index`
2. `soturail read <file> --query "current task"`
3. `soturail run npm test`
4. `soturail expand <raw_id>` for full evidence

Stable prompt blocks belong before dynamic run details.
