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
