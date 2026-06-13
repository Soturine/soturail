# SotuRail v1.4.0

SotuRail v1.4.0 combines Knowledge, Evidence, Evaluation, Skills and Tasklets into one source-backed local workflow. The previously planned v1.3.0 scope is absorbed into this release because useful skills depend on knowledge compilation, provenance and deterministic evaluation.

## Added

- `soturail knowledge estimate|compile|update|verify|list`
- `soturail evidence collect|verify|report`
- `soturail eval dataset init|run`
- `soturail eval golden|regression`
- `soturail skills template|lint|eval|report|build|fold-in`
- `soturail tasklet create|list|run --dry-run|export`
- Local knowledge packs, provenance reports, Agent QA fixtures, Skill Rail 2.0 packs and tasklet exports
- Documentation index and Markdown link checker

## Changed

- Reorganized documentation into getting-started, rail, reference, architecture, security, ecosystem, roadmap, release and tutorial sections.
- Rewrote README as a concise landing page.
- Updated roadmap direction so v1.3.0 is explicitly absorbed into v1.4.0.

## Safety

- No embeddings, cloud calls, required model provider or mandatory database.
- No unsupported verification claims.
- No autonomous tasklet execution or hidden shell commands.
- No required server or destructive MCP expansion.

## Verification

```bash
npm install
npm run typecheck
npm run build
npm test
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
npm run release:check
```

## Known Limitations

- Knowledge summaries are deterministic local extracts, not semantic model summaries.
- Evidence verification checks recorded local artifacts; it does not execute verification commands.
- LLM-as-judge remains optional and documentation-only.
- Knowledge Graph, Host Router, governance/cost and Conductor runtimes remain planned.
