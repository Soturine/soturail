# Windows Notes

SotuRail supports Windows through Node.js and uses cross-platform path handling internally. The main practical differences are shell quoting and how commands are pasted.

## Install Globally

PowerShell and CMD:

```powershell
npm install -g soturail
soturail --help
```

## Run With npx

```powershell
npx soturail --help
npx soturail init
```

## Test a Local Tarball

From a source checkout:

```powershell
npm run build
npm pack --dry-run
npm pack
npm install -g .\soturail-0.2.3.tgz
soturail --version
```

If the tarball name changes, use the exact file that `npm pack` created.

## CMD vs PowerShell

PowerShell accepts commands like:

```powershell
node .\dist\cli.js read ".\README.md" --query "quick start"
```

CMD uses similar quoting, but it does not understand Markdown code-fence labels. Do not paste the literal fence label:

```text
```bat
```

into CMD. CMD will try to execute it and report an error.

## Paths With Spaces

Quote paths that contain spaces:

```powershell
soturail read "C:\Users\rafael\Documents\My Project\README.md" --query "install"
```

## Avoid Accidental Command Concatenation

When copying examples, keep commands on separate lines. This is wrong:

```text
node app.jsnpx soturail --help
```

Run them separately:

```powershell
node app.js
npx soturail --help
```

## Safety

SotuRail blocks destructive command shapes through `soturail run`, including `rm -rf`, `sudo`, `del /s`, downloaded script piping and automatic `git push`.

## Release Checks On Windows

Before publishing from Windows, run:

```powershell
npm run build
node .\dist\cli.js --version
npm run release:check
```

`package.json`, `package-lock.json`, `node dist/cli.js --version`, the npm tarball name, the changelog and the release notes must all agree on the same version.

Use browser-based npm login when needed:

```powershell
npm login --auth-type=web
npm whoami
```

Only create the GitHub release after npm publish succeeds and `npx --yes soturail@X.Y.Z --version` prints the published version.
