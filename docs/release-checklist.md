# Release Checklist

Before publishing:

- [ ] Confirm `npm whoami` works for the publishing account.
- [ ] Confirm npm 2FA requirements and have the authenticator ready.
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] `npm audit --omit=dev`
- [ ] `node dist/cli.js self all`
- [ ] `npm pack --dry-run`
- [ ] `npm run release:check`
- [ ] Confirm docs mention limitations honestly.
- [ ] Confirm no telemetry exists.
- [ ] Confirm no `git push` is routed through `soturail run`.

## Audit Distinction

`npm audit` checks all dependencies, including dev dependencies used for local tests and builds.

`npm audit --omit=dev` checks runtime/public dependency risk for published package users.

Runtime audit is clean with `npm audit --omit=dev`. Remaining audit findings, if any, are development dependency findings and should be upgraded safely without `--force`.

For v0.2.2, the full audit findings are in the Vitest/Vite development test stack. npm's suggested fix is a semver-major Vitest upgrade, so do not run `npm audit fix --force` blindly.

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
