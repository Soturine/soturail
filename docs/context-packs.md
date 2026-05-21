# Context Packs

Context packs are target-aware Markdown payloads for AI coding agents.

```bash
soturail context pack --target claude
soturail context pack --target codex
soturail context pack --target gemini
soturail context pack --target cursor
soturail context pack --target generic
soturail context explain
soturail context doctor
```

Generated files live in `.soturail/context/`.

Stable-cache order:

1. Static SotuRail header.
2. Governance files summary.
3. Project config.
4. Repo map summary.
5. Approved rules.
6. Approved specs.
7. Approved memory.
8. Skills summary.
9. Dynamic footer with timestamps, current commit, raw IDs and recent command notes.

Dynamic data never appears before stable blocks.
