# Tutorial: Harness-Style Workflow

This workflow borrows setup/plan/work/review/release discipline without making SotuRail a Claude-only harness.

```bash
soturail init
soturail workflow new "Ship feature"
soturail context route --query "Ship feature"
soturail context pack --role planner
soturail harness contract init
soturail fs snapshot
soturail policy doctor
soturail agents doctor --verbose
```

During work, record evidence:

```bash
soturail run npm test
soturail fs diff
soturail harness note "Agent missed verification step"
soturail workflow evidence <workflow-id>
```

Before release, review build/test/audit evidence, raw IDs, policy decisions and changed files. Do not mark work done if verification failed.
