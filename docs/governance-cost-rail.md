# Governance And Cost Rail

Governance And Cost Rail is the planned v1.5.x direction for local guardrails around dynamic workflows, context budgets, repeated tool calls, always-loaded skills and MCP exposure.

## Goal

Warn humans and agents before workflows become expensive, risky or hard to audit.

SotuRail should not manage provider billing by default. It should provide local risk evidence and clear assumptions.

## Planned Signals

- giant root agent docs;
- repeated instructions across host files;
- always-loaded skills;
- broad MCP exposure;
- large raw logs copied into prompt context;
- missing role packs;
- missing offload/recovery pointers;
- dynamic workflow/subagent risk;
- stale Project Brain evidence;
- benchmark/report age;
- missing release evidence.

## Possible Commands

```bash
soturail budget doctor
soturail budget report
soturail policy budget
soturail workflow budget <id>
```

The exact command names are not frozen. The concept can also be implemented as report/status sections first.

## Report Sections

A governance/cost report should include:

- context risk;
- workflow depth risk;
- MCP exposure risk;
- skill loading risk;
- raw log risk;
- stale evidence risk;
- release readiness;
- recommended safe next commands.

## Safe Recommendations

Examples:

```bash
soturail context prune
soturail context offload <raw_id>
soturail context pack --role reviewer
soturail agents lint
soturail mcp exposure
soturail report build
soturail brain stale --repair-plan
```

## Non-Goals

- no provider billing integration by default;
- no telemetry upload;
- no automatic external account configuration;
- no live price claims without versioned evidence and user review;
- no automatic disabling of external tools without explicit user action.

## Relationship To Existing Rails

| Existing rail | Governance/cost connection |
| --- | --- |
| Context Intelligence | context size and selection risk |
| Report Rail | human/agent-visible risk cards |
| Observability Rail | local event trends |
| Policy Rail | approvals and risky action gates |
| MCP Report Resources | exposure inventory |
| Workflow Rail | phase depth and evidence completeness |
| Benchmark Rail | performance evidence and stale report warnings |

## Resilience And Host Router Expansion

Future v1.5 planning now includes Resilience Rail and Host Router Rail:

- [`resilience-rail.md`](resilience-rail.md) for retry/fallback/rate-limit documentation and risk reports;
- [`rate-limit-and-fallback-policy.md`](rate-limit-and-fallback-policy.md) for local policy shape;
- [`host-router-rail.md`](host-router-rail.md) for context-format routing across hosts.

This does not turn SotuRail into a model proxy, account manager, MITM bridge or billing gateway.
