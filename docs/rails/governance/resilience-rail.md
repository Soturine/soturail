# Resilience Rail

Resilience Rail is a planned documentation/reporting surface for rate limits, retries, fallback policies and long-running agent workflow risk.

It is inspired by multi-agent demos that break when APIs rate-limit, provider-specific parameters differ or workflows call tools repeatedly. SotuRail should not become a proxy or router. It should help users see and document the risk before handing work to an agent.

## Goals

- Identify missing retry/fallback documentation in agent workflows.
- Warn when workflows rely on a single provider or host feature.
- Record safe fallback formats for host exports.
- Estimate context and workflow depth risk locally.
- Keep all provider/cost notes assumption-based unless user supplies evidence.

## Proposed Commands

```bash
soturail agents resilience doctor
soturail agents provider matrix
soturail governance fallback-policy
soturail governance rate-limit
soturail cost context
```

Names are not frozen; the first implementation can be report sections inside `status`, `report` or `agents doctor`.

## Checks

A resilience report can check:

- workflow has no fallback path;
- root docs mention a provider but no rate-limit policy;
- provider-specific parameters are not documented;
- long-running workflows lack pause/resume handoff;
- context packs are too large for a target host;
- MCP exposure is broad but no approval policy exists;
- generated host export lacks a prompt-only fallback.

## Safe Boundary

SotuRail should not:

- proxy model requests;
- intercept IDE or browser traffic;
- manage provider accounts;
- bypass quotas;
- claim unlimited free access;
- patch provider requests automatically.
