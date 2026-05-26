# Release Workflow

SotuRail releases should be repeatable and evidence-backed. Release helpers are exposed through `soturail release`.

## Check

```bash
npm run release:check
```

Runs install, build, tests, runtime audit, self-dogfooding, pack dry-run and npm version checks. It also reports whether full audit findings are development-only.

The check also verifies:

- `package.json` and `package-lock.json` version sync;
- `node dist/cli.js --version` matches the package version;
- npm pack dry-run emits the matching tarball name;
- the packed tarball installs into a clean temp project and its installed CLI prints the package version;
- expected package files are present and forbidden generated files are absent;
- `CHANGELOG.md` and `docs/releases/RELEASE_NOTES_vX.Y.Z.md` exist for the local version;
- README install instructions and `LICENSE` exist.
- required GitHub CI and community files exist under `.github/`.

You can run only the package verification gate with:

```bash
soturail release verify-package
```

This catches stale generated version files that local source checks might miss.

As of v0.3.3, release verification installs the packed `.tgz` into a clean temporary project and executes the CLI from `node_modules/soturail/dist/cli.js`. It does not call global `soturail`, `npx soturail` or `npm exec --package=soturail`, which avoids npm cache/global CLI false positives.

Keep using this packed-package gate before publishing. `npm exec --package=soturail@<version>` is a post-publish registry verification, not the pre-publish source of truth.

## Publish

```bash
npm run release:publish -- X.Y.Z
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
npm run release:publish -- X.Y.Z
Remove-Item Env:NPM_CONFIG_OTP
```

## Full

```bash
npm run release:full -- X.Y.Z --publish-npm --github-release
```

Full mode runs release gates, then publishes to npm only when `--publish-npm` is supplied, and creates or updates the GitHub release only when `--github-release` is supplied.

For explicit CLI usage:

```bash
soturail release publish X.Y.Z
soturail release github X.Y.Z
soturail release full X.Y.Z --publish-npm --github-release
```

Release commands also accept `--target-version X.Y.Z`. The older `--version X.Y.Z` form remains supported for npm scripts, but the positional form avoids confusion with the global `soturail --version` flag.

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
