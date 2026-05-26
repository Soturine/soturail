# Monthly Income Dashboard

This document defines the passive-income dashboard for SoturAI.

The dashboard should help the user monitor estimated monthly income, income target progress, allocation, concentration, provider health and risk warnings.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`FII_INCOME_RADAR.md`](FII_INCOME_RADAR.md)
- [`DIVIDEND_STOCK_RADAR.md`](DIVIDEND_STOCK_RADAR.md)
- [`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md)
- [`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md)
- [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md)
- [`BROKER_API_HEALTH_MONITOR.md`](BROKER_API_HEALTH_MONITOR.md)

## Core principle

```text
The dashboard should show both income and the risks behind that income.
```

## Dashboard goals

```text
show estimated monthly income
show income target progress
show income by asset
show income by asset class
show income by sector
show dividend/calendar events
show reinvestment scenarios
show concentration risk
show yield-trap warnings
show provider/API health warnings
show manual-data assumptions
```

## Example view

```text
Monthly income target: R$ 100.00
Estimated monthly income: R$ 23.50
Remaining to target: R$ 76.50

Portfolio allocation:
FIIs: 60%
Dividend stocks: 25%
Fixed-income/manual entries: 15%

Risk notes:
- high yield review required
- low diversification
- high concentration in one FII segment
- stale provider data on one asset
```

## Suggested widgets

```text
income target progress
monthly income chart
12-month income history
income calendar
asset contribution table
sector contribution table
asset-class allocation
risk warning panel
yield-trap alert panel
reinvestment projection
provider health status
manual assumptions panel
```

## Dashboard data contract

```json
{
  "dashboard_id": "uuid",
  "portfolio_id": "uuid",
  "mode": "PASSIVE_INCOME_RESEARCH",
  "base_currency": "BRL",
  "monthly_target": 100.0,
  "estimated_monthly_income": 23.5,
  "remaining_to_target": 76.5,
  "risk_status": "WARN",
  "provider_status": "OK",
  "created_at": "2026-05-25T12:00:00Z"
}
```

## Income sections

The dashboard should split income by:

```text
asset
asset class
sector
currency
status
source/provider
recurring vs non-recurring
estimated vs announced vs recorded
```

## Risk sections

Warnings should include:

```text
yield trap risk
recent income cut
high asset concentration
high sector concentration
low liquidity
high vacancy for FIIs
high payout ratio for stocks
manual assumption missing source
stale provider data
broker/API health degraded
```

## Integration with calendar

[`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md) should feed upcoming and recorded income events.

## Integration with simulator

[`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md) should feed projected scenarios, with assumptions clearly labeled.

## Integration with Income Risk Firewall

[`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md) should determine whether income candidates are allowed, warned, review-required or blocked.

## Final rule

```text
A passive-income dashboard must never hide risk behind a pretty yield number.
```
