# Knowledge To Rules

SotuRail v0.8.0 connects verified Project Brain knowledge to operational rules.

The flow is:

```txt
source evidence -> brain claim or decision -> reviewed rule -> agent/workflow guidance
```

## Commands

```bash
soturail brain scan
soturail rules from-brain
soturail rules doctor
```

`rules from-brain` converts verified claims and active decisions into advisory rules and writes:

```txt
.soturail/brain/rules.jsonl
.soturail/rules/from-brain.md
```

Each brain-derived rule links back to claim IDs or decision IDs.

## Example Rules

- Release notes must live under `docs/releases/`.
- Run `npm run release:check` before npm publish.
- Do not expose arbitrary shell execution through MCP.
- Do not treat Diagram Rail validation as a full Mermaid parser.
- Keep native acceleration optional.

## Review Model

Brain-derived rules start as local guidance. Promote them to policy gates only after review and supporting tests/evidence.

Useful review questions:

- Does the rule cite a verified claim or active decision?
- Is the source still fresh?
- Does a test or release gate validate the rule?
- Could the rule expose secrets or raw logs?
- Should it remain advisory instead of a hard gate?
