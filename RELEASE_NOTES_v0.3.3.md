# SotuRail v0.3.3 - Package Verification Hotfix

SotuRail v0.3.3 fixes the packed package CLI verification path used before npm releases.

## Highlights

- Fixes packed package CLI version verification.
- Avoids npm cache, `npx`, `npm exec` and global CLI false positives.
- Strengthens cross-platform release gates on Windows, Linux and macOS.
- Keeps runtime audit clean.
- Does not add new product features.

## Install

```bash
npm install -g soturail@0.3.3
soturail --version
```

## Validate

```bash
npm run build
npm test
npm audit --omit=dev
npm run release:check
```

## Notes

Release verification now installs the packed `.tgz` into a clean temporary project and executes `node_modules/soturail/dist/cli.js` directly.
