# Release Workflow

SotuRail releases should be repeatable and evidence-backed. The release helper lives at `scripts/release.mjs`.

## Check

```bash
npm run release:check
```

Runs install, build, tests, runtime audit, self-dogfooding, pack dry-run and npm version checks. It also reports whether full audit findings are development-only.

The check also verifies:

- `package.json` and `package-lock.json` version sync;
- `node dist/cli.js --version` matches the package version;
- npm pack dry-run emits the matching tarball name;
- `CHANGELOG.md` and `RELEASE_NOTES_vX.Y.Z.md` exist for the local version;
- README install instructions and `LICENSE` exist.

## Prepare

```bash
npm run release:prepare -- --version X.Y.Z
```

Prepare mode:

- validates the version argument;
- updates `package.json`, `package-lock.json` and CLI version text;
- updates `CHANGELOG.md`;
- creates `RELEASE_NOTES_vX.Y.Z.md`;
- runs validation;
- commits `chore(release): prepare vX.Y.Z`;
- pushes `main`;
- never publishes to npm.

## Publish

```bash
npm run release:publish -- --version X.Y.Z
```

Publish mode refuses to publish if build, tests, release preflight or runtime audit fail, if the git tree is dirty, or if the version already exists on npm.

For browser-based npm login:

```bash
npm login --auth-type=web
npm whoami
```

If npm asks for 2FA during publish, use a fresh authenticator code:

```powershell
$env:NPM_CONFIG_OTP="<code>"
npm run release:publish -- --version X.Y.Z
Remove-Item Env:NPM_CONFIG_OTP
```

## Full

```bash
npm run release:full -- --version X.Y.Z
```

Full mode runs prepare, publish and then creates or updates the GitHub release using `gh` when available. If the npm version already exists, full mode skips npm publish and only creates or updates the GitHub release.

Only create or update the GitHub release after npm publish succeeds and these checks pass:

```bash
npm view soturail version
npx --yes soturail@X.Y.Z --version
```

Safety rules:

- Never run `npm audit fix --force`.
- Never publish if tests fail.
- Never publish if build fails.
- Never publish if runtime audit fails.
- Never publish if the requested package version already exists on npm.
- Never create a GitHub release before npm publish succeeds.
- Never hide errors.
