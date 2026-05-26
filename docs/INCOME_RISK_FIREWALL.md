# Income Risk Firewall

This document defines the passive-income risk layer for SoturAI.

The Income Risk Firewall protects the portfolio from blindly chasing yield, especially in FIIs, dividend stocks, ETFs, REITs and fixed-income/manual entries.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`FII_INCOME_RADAR.md`](FII_INCOME_RADAR.md)
- [`DIVIDEND_STOCK_RADAR.md`](DIVIDEND_STOCK_RADAR.md)
- [`YIELD_TRAP_SCANNER.md`](YIELD_TRAP_SCANNER.md)
- [`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md)
- [`BROKER_API_HEALTH_MONITOR.md`](BROKER_API_HEALTH_MONITOR.md)

## Core principle

```text
Income is useful only if the risk behind it is visible.
```

High yield must never be treated as a buy signal by itself.

## Decisions

Allowed decisions:

```text
ALLOW
WARN
REVIEW_REQUIRED
BLOCK
```

Meaning:

```text
ALLOW -> can appear as candidate
WARN -> can appear with warnings
REVIEW_REQUIRED -> requires manual review before any portfolio action
BLOCK -> hidden from ranking or marked as high risk
```

## Main checks

The first version should check:

```text
yield too high compared to peers
recent income cut
income paid from non-recurring source
price drawdown creating artificial high yield
low liquidity
high concentration by asset
high concentration by sector
high concentration by issuer/manager
high vacancy, for FIIs
high tenant concentration, for FIIs
high payout ratio, for stocks
high debt
missing data
stale provider data
broker/API health degraded
```

## FII-specific checks

```text
vacancy high or rising
tenant concentration high
single-property concentration
segment stress
CRI/default exposure for paper funds
P/VP far away from peer range
recent distribution cut
extraordinary distribution treated as recurring
manager/report data missing
```

## Dividend-stock checks

```text
payout ratio too high
free cash flow weak
earnings falling
dividend cut history
one-time dividend treated as recurring
debt rising
liquidity too low
sector cyclicality ignored
price drawdown inflating yield
```

## Fixed-income/manual-entry checks

```text
manual yield assumption missing source
maturity not defined
issuer risk not classified
liquidity not defined
mark-to-market risk ignored
indexer not defined
payment schedule unknown
```

## Provider and API checks

Before trusting fresh income or market data, the Income Risk Firewall should consider provider health from [`BROKER_API_HEALTH_MONITOR.md`](BROKER_API_HEALTH_MONITOR.md):

```text
provider status
latency
stale data
rate limit
authentication failure
disconnects
last successful update
```

If provider health is bad, the income candidate should be downgraded or blocked.

## Decision contract

```json
{
  "decision_id": "uuid",
  "symbol": "EXAMPLE11",
  "asset_class": "FII",
  "decision": "REVIEW_REQUIRED",
  "severity": "HIGH",
  "mode": "PASSIVE_INCOME_RESEARCH",
  "reasons": [
    "yield far above peers",
    "recent price drawdown",
    "latest distribution may be non-recurring"
  ],
  "created_at": "2026-05-25T12:00:00Z"
}
```

## Severity levels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

## Ranking impact

```text
ALLOW -> keep normal score
WARN -> reduce score and show warning
REVIEW_REQUIRED -> remove from automatic ranking, show as manual-review candidate
BLOCK -> do not recommend, show only in risk report
```

## Human review rule

Any candidate with `REVIEW_REQUIRED` or `BLOCK` must not trigger automatic portfolio actions.

Future broker-connected modes must remain:

```text
read-only first
approval-required later
live rebalance locked by default
```

## Final rule

```text
The Income Risk Firewall must be harder to fool than a simple dividend-yield ranking.
```
