# Release Workflow

```bash
soturail self all
soturail release check
npm pack --dry-run
```

Only create a GitHub release after npm publish succeeds and the published CLI version is verified.
