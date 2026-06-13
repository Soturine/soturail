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
.soturail/rules/from-brain.json
```

Each brain-derived rule links back to claim IDs or decision IDs.

## v0.8.1 Safety Model

Rule derivation is conservative:

- verified claims with validation references can become `test-backed` rules;
- verified release, policy or security claims can become `policy-gate` candidates;
- verified claims without tests usually become `manual-review`;
- unverified claims stay advisory/draft;
- suspect or stale claims do not create active rules by default;
- superseded or rejected decisions do not create active rules.

Use this repair-first flow when rules look weak or stale:

```bash
soturail brain stale --repair-plan
soturail brain consolidate --dry-run
soturail rules from-brain
soturail rules doctor
```

`rules doctor` reports brain-derived rule counts, active/advisory rules, missing source links and stale-source warnings.

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
