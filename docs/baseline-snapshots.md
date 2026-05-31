# Baseline Snapshots

v0.9.0 adds baseline snapshot helpers so source, history and package artifacts are created with reviewed commands instead of manual whole-folder zips.

```bash
soturail self baseline --check
soturail self baseline --zip
soturail self baseline --bundle
soturail self baseline --pack
```

Reports are written to:

```txt
.soturail/baselines/latest.json
.soturail/baselines/latest.md
```

## What `--check` Looks For

- `.git`
- `.github`
- `.github/workflows/ci.yml`
- `docs/releases/`
- `README.md`
- package/CLI version sync
- `CHANGELOG.md` entry for the current version
- `docs/releases/RELEASE_NOTES_v<version>.md`
- npm pack metadata readiness
- git working tree status

It warns when `node_modules` is present because dependency folders are not source snapshots.

## Artifact Commands

Use a clean source zip:

```bash
git archive --format=zip --output .soturail/baselines/soturail-v0.9.0-source.zip HEAD
```

Use a history backup:

```bash
git bundle create .soturail/baselines/soturail-v0.9.0.bundle --all
```

Use an npm package snapshot:

```bash
npm pack --pack-destination .soturail/baselines
```

Do not manually zip the whole working directory. That tends to include `.git`, `node_modules`, local raw logs or generated artifacts.
