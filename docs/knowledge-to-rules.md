# Knowledge-to-Rules Engine

SotuRail can ingest heavy documents into reusable structured rules:

```bash
soturail ingest docs/requirements.md --type requirements
soturail rules list
soturail rules check
soturail rules export --format yaml
```

Supported v0.2.0 inputs:

- Markdown
- TXT
- JSON
- YAML

PDF extraction is documented as experimental and disabled unless a safe text extraction path is added later.

Rules are deterministic and cite source file, source section and content hash. SotuRail should not invent rules that do not appear in the source.
