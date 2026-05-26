# Reinvestment Simulator

This document defines the reinvestment simulator for SoturAI's passive-income layer.

The simulator estimates how portfolio income may evolve if dividends, FII distributions, ETF distributions, REIT distributions, fixed-income payments or manual income entries are reinvested.

It does not guarantee future income.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`FII_INCOME_RADAR.md`](FII_INCOME_RADAR.md)
- [`DIVIDEND_STOCK_RADAR.md`](DIVIDEND_STOCK_RADAR.md)
- [`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md)
- [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md)
- [`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md)

## Core principle

```text
A reinvestment simulation is a planning scenario, not a promise of passive income.
```

SoturAI should clearly separate:

```text
capital invested
external contributions
income received
income reinvested
price movement
estimated future income
risk warnings
```

## Goals

The simulator should answer:

```text
What happens if all income is reinvested?
How much estimated monthly income could the portfolio generate over time?
How much of the growth comes from new contributions?
How much of the growth comes from reinvested income?
How sensitive is the projection to yield changes?
What happens if distributions are cut?
```

## Supported income sources

```text
FIIs
Brazilian dividend stocks
US dividend stocks
ETFs and income ETFs
REITs, future international module
fixed income/manual entries
cash/reserve yield
```

## Inputs

```text
initial portfolio value
current positions
monthly contribution
estimated income per asset
income event calendar
target allocation
reinvestment rule
simulation horizon
price assumption
yield assumption
tax/fee assumption, optional
currency
risk profile
```

## Reinvestment rules

Possible strategies:

```text
reinvest in the same asset
reinvest into underweight asset
reinvest into lowest-risk income candidate
reinvest into target allocation
hold as cash until minimum order amount
manual approval required
```

Early versions should default to:

```text
manual approval required
```

## Output metrics

```text
estimated monthly income over time
estimated annual income over time
estimated portfolio value over time
total external contributions
total reinvested income
income by asset class
income by asset
allocation drift
concentration warnings
yield sensitivity
risk warnings
```

## Simulation contract

```json
{
  "simulation_id": "uuid",
  "portfolio_id": "uuid",
  "mode": "PASSIVE_INCOME_RESEARCH",
  "base_currency": "BRL",
  "initial_value": 10000.0,
  "monthly_contribution": 500.0,
  "horizon_months": 120,
  "reinvestment_rule": "target_allocation",
  "estimated_initial_monthly_income": 65.0,
  "projection_type": "estimate_not_guarantee",
  "created_at": "2026-05-25T12:00:00Z"
}
```

## Scenario types

Recommended scenarios:

```text
base case
conservative case
income cut case
price drawdown case
high contribution case
no contribution case
cash hold case
```

## Risk checks

Before showing a projection, SoturAI should check:

```text
yield assumptions are not extreme
income source is recurring or labeled as non-recurring
provider data is fresh enough
portfolio is not overconcentrated
manual fixed-income assumptions are visible
fees/taxes are either modeled or explicitly omitted
```

If the check fails, route the result through [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md).

## Report wording

Use:

```text
estimated income
projected scenario
assumption-based simulation
risk-adjusted scenario
```

Avoid:

```text
guaranteed income
safe income
profit while sleeping
automatic passive profit
```

## Future implementation notes

Possible future files:

```text
src/soturai/income/reinvestment.py
src/soturai/income/scenarios.py
src/soturai/income/projections.py
src/soturai/income/reporting.py
```

## Final rule

```text
The simulator helps plan scenarios.
It must not sell certainty.
```
