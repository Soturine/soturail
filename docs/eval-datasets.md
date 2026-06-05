# Eval Datasets

Eval datasets are planned local fixtures for checking whether SotuRail outputs preserve the facts, paths, warnings and contracts that agents need.

## Dataset Shape

A minimal dataset case can include:

```json
{
  "id": "host-export-readonly-mcp",
  "input": {
    "command": "soturail agents export --agent claude",
    "fixture": "basic-typescript-project"
  },
  "expected": {
    "mustContain": ["read-only", "MCP", "safe next commands"],
    "mustNotContain": ["destructive MCP", "cloud telemetry required"],
    "jsonPaths": ["host", "capabilities", "limitations"]
  }
}
```

## Dataset Families

| Family | What it protects |
| --- | --- |
| host compatibility | exports for Claude, Codex, Cursor, OpenCode, Gemini and generic hosts |
| context quality | selected files, commands, errors and policy notes survive compaction |
| skill routing | only task-relevant skills are selected |
| evidence/provenance | reports include source paths, verification status and missing-proof notes |
| governance/cost | huge docs, broad MCP exposure and always-loaded skills warn correctly |
| release checks | version, changelog, pack, docs and evidence are connected |

## Rules

- Datasets must be small enough to run during normal development.
- Datasets must be deterministic by default.
- Dataset results should be written as JSON and Markdown.
- A dataset failure should say what evidence was missing, not only that text did not match.
