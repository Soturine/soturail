# SotuRail v1.6.1 — Corrective Release

Released: 2026-10-18. Requires Node.js 22 or 24.

**Errata (tag `v1.6.1`, commit `242999a`).** The CHANGELOG and release notes inside the published package and at the tag were written before publication: the CHANGELOG heading reads `[1.6.1] - UNRELEASED` and the release notes say "Status: prepared, not published". v1.6.1 was published to npm on 2026-10-18. The tag is not moved or rewritten; only these two texts are affected, not code or behavior. The corrected texts live on `main`.

v1.6.1 fixes defects in v1.6.0 that were found by dogfooding the published package on external projects and by running real coding agents with and without SotuRail ([qualification results](../audits/v1.7.0-real-agent-qualification-results.md)). It adds no new commands and changes no defaults.

## Fixed

- **Readiness in ordinary projects.** In a project that does not gitignore `.soturail/` — which is what `soturail init` produced — every `soturail run` changed the workspace fingerprint it had just been bound to, so a change contract never became `ready` (4 of 5 external projects with passing checks). The fingerprint now excludes SotuRail's own runtime state; configuration stays bound. With real agents, this defect turned correct Codex results into "not ready" in 5 of 12 tasks.
- **No false green without Git.** In a directory without a Git work tree, the fingerprint saw no edits at all, so a contract verified `ready`, the code changed, and it still verified `ready`. Workspace content is now hashed when there is no Git work tree; a workspace too large to scan fails closed (evidence can never look current). Git-based fingerprints are byte-for-byte unchanged.
- **Runtime state stays out of Git.** The security model already said never to commit `.soturail/raw/`; nothing enforced it. SotuRail now writes `.soturail/.gitignore` (only if missing, never over a user edit, without touching the project's own `.gitignore`): deny by default, with `config/config.json`, `contracts/`, `rules/`, `skills/` and `specs/` versionable.
- **Clear missing-path errors.** `Path not found: <path>` replaces Node's raw `ENOENT … realpath '<absolute path>'`; the `ENOENT` code is preserved for callers.
- **Usable MCP config.** `mcp config` output now contains a host-native `mcpServers` entry running `npx -y soturail@<this version>`, verified to connect from Claude Code on Windows. Previously the snippet was not a host config and its bare `soturail` command ran whatever version was first on `PATH`.

## Changed

- **Proportional Skills.** The bundled Skills reserve contracts, impact candidates and evidence verification for material work, use the host's own file tools for ordinary files (`project.read` for untrusted paths, possible secrets and large files; Security keeps it) and record only findings that must outlive the session. On the valid qualification tasks this cut Codex's SotuRail calls by about a third and its tokens by about a fifth with no loss of success.

## Not in this release

Kept for the next minor release because they change defaults or add surface: minimal `soturail init` (starter docs behind `--with-docs`) and `soturail run --summary-only`.

## Upgrade notes

- Evidence recorded by 1.6.0 in a project without `.soturail/` gitignored, or without Git, may read as stale once after upgrading. Re-run the checks.
- Already-committed `.soturail/` files stay tracked; remove runtime directories with `git rm -r --cached .soturail/raw` (and similar) if they were committed.

## Release identity

| Item | Value |
|---|---|
| Tag / commit | `v1.6.1` / `242999ab76d9cdc7d68b12676d58a6f43d1f6289` |
| npm | `soturail@1.6.1`, `latest` |
| Tarball SHA-256 | `fd511fb061c928a2c2c7a17cfd22454fddd5173238733c8d739de0fb02c6b3ea` (npm download byte-identical to the attested artifact) |
| npm integrity | `sha512` of the same bytes; npm shasum `750262022d7d50301816e423c02a23d90c30dcef` |
| Provenance | GitHub build provenance (SLSA v1) and CycloneDX SBOM attestations from `.github/workflows/release-provenance.yml@refs/tags/v1.6.1`; verify with `gh attestation verify soturail-1.6.1.tgz --repo Soturine/soturail` |
| Not provided | npm-native provenance (`--provenance`) and a recorded `gitHead` in the registry, as in 1.6.0 |

The SBOM lists the dependency versions resolved at build time (`@modelcontextprotocol/core` and `server` 2.0.0, `commander` 12.1.0, `zod` 4.4.3). The package ships no lockfile, so a fresh install resolves the caret ranges to newer releases (on 2026-10-18: MCP 2.3.1, `zod` 4.6.7); the post-publish smoke tests ran with those.

## Verification

Full test suite, typecheck, documentation links, MCP smoke, architecture check, release preflight and package verification on the release commit; candidate package installed in isolation and exercised on seven projects (Node, Python, a Unicode/space path, a pt-BR Python+TypeScript monorepo, a pt-BR Kotlin project, a new repository without commits or `.gitignore`, and a directory without Git). After publication, `soturail@1.6.1` installed from the registry passed the same flow on the same seven projects (CLI, Skills for three hosts, capabilities, MCP stdio, contracts, freshness, errors, Git rules). Results: `benchmarks/agent-qualification/results/dogfood-release-1.6.1-242999a/` and `dogfood-npm-1.6.1/`.
