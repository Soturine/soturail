# Dashboard Rail

Dashboard Rail builds a static local HTML dashboard from report and status artifacts.

```bash
soturail dashboard build
soturail dashboard open
soturail dashboard doctor
```

Artifacts:

```txt
.soturail/dashboard/index.html
.soturail/dashboard/data/report.json
.soturail/dashboard/data/status.json
.soturail/dashboard/assets/
```

The dashboard is plain local HTML/CSS. It has no framework dependency, no external CDN, no telemetry and no server requirement.

Dashboard cards cover project status, release status, brain health, eval summary, benchmark summary, native candidates, baseline snapshot, workflow evidence, harness failures, diagram validation, agent readiness and next commands.

`dashboard doctor` checks that the files exist, that the HTML has no external scripts or external stylesheet URLs and that the local file size is reasonable.
