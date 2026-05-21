# SotuRail v0.3.0 - Skill Rail, MCP & Context Packs

SotuRail v0.3.0 adds Skill Rail, a local MCP-compatible stdio server, and cache-friendly context packs for AI coding agents.

## Install

```bash
npx --yes soturail@0.3.0 --help
npm install -g soturail@0.3.0
soturail --version
```

## Highlights

- `soturail skills` creates, validates, exports and packs safe local agent skills.
- `soturail mcp` exposes read-only resources and safe tools over JSON-RPC style stdio.
- `soturail context pack` builds target-aware context packs with stable content before dynamic session data.
- Hooks now support reviewed exports and the `--agent` / `--mode` command shape.
- Benchmarks include Skill Rail, MCP, context packs, hook export and memory workflow cases.
- Release automation validates package/CLI version sync, changelog, release notes, runtime audit and npm pack contents before publication.

## Safety

SotuRail remains local-first. The MCP server does not expose arbitrary shell execution in v0.3.0. Raw logs may contain secrets, and MCP raw-log expansion redacts probable secrets unless explicitly requested with `allow_raw=true`.

## Validation

- `npm run build`
- `node dist/cli.js --version`
- `npm test`
- `npm audit --omit=dev`
- `npm audit`
- `node dist/cli.js self all`
- `node dist/cli.js bench`
- `node dist/cli.js release check`
- `npm pack --dry-run`

## Links

- npm: https://www.npmjs.com/package/soturail
- GitHub: https://github.com/Soturine/soturail
