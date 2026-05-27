# Rules

Extracted rules are written to:

- `.soturail/rules/rules.yml`
- `.soturail/rules/checklist.md`
- `.soturail/rules/citations.json`
- `.soturail/rules/validators/`

Each rule includes:

- id
- title
- description
- source_file
- source_section
- severity
- validation_type
- suggested_validator_name
- created_at
- content_hash

`soturail rules check` runs deterministic validators for package metadata, required files, forbidden files, README sections, CI workflow presence and documentation presence when the rule text supports it.

## Brain-Derived Rules

v0.8.0 adds:

```bash
soturail rules from-brain
soturail rules doctor
```

`rules from-brain` converts verified Project Brain claims and active decisions into reviewed local rule candidates. It writes:

```txt
.soturail/brain/rules.jsonl
.soturail/rules/from-brain.md
```

Each rule links back to claim IDs or decision IDs. Treat the output as advisory until a human promotes it to a policy gate or deterministic validator.

## Planned Policy Rule IDs

Policy Rail should eventually expose stable, readable rule IDs for risky agent-assisted actions.

Possible future rules:

```txt
R01 deny sudo
R02 deny writing .env or secret files
R03 ask before rm -rf
R04 deny git push --force
R05 ask before npm publish
R06 deny --no-verify unless explicitly approved
R07 warn before direct push to main/master
R08 require evidence before release
R09 deny arbitrary shell exposure through MCP by default
R10 require explicit confirmation for raw log expansion
R11 backup before agent host config writes
R12 warn when agent docs contain probable secrets
R13 warn when JSON payloads have duplicate keys or unsafe ambiguity
```

These are planned examples, not a promise that every rule lands with the exact ID or command surface.

See [policy-rail.md](policy-rail.md).

## Planned Harness Rules

Harness Rail should convert repeated failures into rules, checks or docs.

Examples:

- repeated Windows CI timeout becomes a release reliability check;
- stale CLI version in packed tarball becomes a package verification rule;
- accidental raw secret exposure becomes a redaction rule;
- missing tests before release becomes an evidence-pack requirement;
- repeated agent misunderstanding becomes a workflow or agent-doc lint rule.

See [harness-rail.md](harness-rail.md).

## Planned Structured Payload Rules

Structured Payload Rail should add validators for context payload quality.

Possible future checks:

- duplicate JSON keys;
- huge arrays without summaries;
- ambiguous machine payload reused as prompt context;
- missing source path or recovery pointer;
- dropped critical error line after formatting;
- malformed tagged context block;
- invalid Mermaid block in a `.spec.md` file.

See [structured-payload-rail.md](structured-payload-rail.md) and [diagram-rail.md](diagram-rail.md).
