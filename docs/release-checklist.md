# Release Checklist

Before publishing:

- [ ] Confirm `npm whoami` works for the publishing account.
- [ ] Confirm npm 2FA requirements and have the authenticator ready.
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm audit --omit=dev`
- [ ] `node dist/cli.js self all`
- [ ] `node dist/cli.js skills --help`
- [ ] `node dist/cli.js mcp --help`
- [ ] `node dist/cli.js context --help`
- [ ] `npm pack --dry-run`
- [ ] `npm run release:check`
- [ ] `node dist/cli.js release verify-package`
- [ ] `node dist/cli.js --version` matches `package.json`.
- [ ] Confirm docs mention limitations honestly.
- [ ] Confirm no telemetry exists.
- [ ] Confirm no `git push` is routed through `soturail run`.

## Version Sync

Check four separate release identifiers before publishing:

- npm package version: `package.json` and `package-lock.json`.
- CLI runtime version: `node dist/cli.js --version`.
- Git tag: created only when the release process calls for it.
- GitHub release: created only after npm publish succeeds.

The package version and CLI runtime version must match. `npm run build` regenerates the CLI version source from `package.json`, and `npm run release:check` verifies the built CLI before publication.

v0.3.2 adds a packed-package verification gate. It runs `npm pack --json`, installs the generated `.tgz` into a temporary clean directory, and verifies both:

```bash
node node_modules/soturail/dist/cli.js --version
npx --no-install soturail --version
```

This gate must print the same version as `package.json`.

## Audit Distinction

`npm audit` checks all dependencies, including dev dependencies used for local tests and builds.

`npm audit --omit=dev` checks runtime/public dependency risk for published package users.

Runtime audit is clean with `npm audit --omit=dev`. Remaining audit findings, if any, are development dependency findings and should be upgraded safely without `--force`.

For v0.2.x, the full audit findings are in the Vitest/Vite development test stack when present. npm's suggested fix may be a semver-major Vitest upgrade, so do not run `npm audit fix --force` blindly.

## npm Login And 2FA

Use browser-based npm login before publishing:

```bash
npm login --auth-type=web
npm whoami
```

If npm requires a one-time password during publish, provide a fresh authenticator code through `NPM_CONFIG_OTP` or `--otp`. Do not commit tokens, OTPs or npm credentials.

PowerShell example:

```powershell
$env:NPM_CONFIG_OTP="<code>"
npm run release:publish -- --version X.Y.Z
Remove-Item Env:NPM_CONFIG_OTP
```

After npm publish succeeds, verify:

```bash
npm view soturail version
npx --yes soturail@X.Y.Z --version
```

Create or update the GitHub release only after those npm checks pass.

## Windows Paste Safety

Do not paste Markdown prose or code-fence labels directly into `cmd.exe` as commands. For example, do not paste ```` ```bat ````. Copy only the command lines themselves.

See [docs/windows.md](windows.md) for CMD and PowerShell quoting notes.

## Automation

Use:

```bash
npm run release:check
npm run release:prepare -- --version X.Y.Z
npm run release:publish -- --version X.Y.Z
npm run release:full -- --version X.Y.Z
```
