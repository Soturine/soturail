# Fixed Income Tracker

This document defines the fixed-income and manual-income tracking layer for SoturAI.

It supports passive-income planning when some income assets are not available through automated providers and need to be represented manually.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md)
- [`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md)
- [`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md)
- [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md)
- [`DATA_LICENSING_AND_PROVIDER_POLICY.md`](DATA_LICENSING_AND_PROVIDER_POLICY.md)

## Core principle

```text
Manual assumptions must be visible.
```

Fixed-income tracking can support planning, but SoturAI must clearly separate provider-backed data from user-entered assumptions.

## Goals

```text
represent fixed-income style assets in passive-income dashboards
track manual income assumptions
connect estimated payments to the dividend calendar
feed conservative reinvestment simulations
warn when assumptions are stale or incomplete
avoid treating projections as guaranteed income
```

## Supported entry types

```text
fixed-rate income asset
floating-rate income asset
benchmark-linked income asset
inflation-linked income asset
cash or reserve yield entry
manual monthly income entry
provider-backed future income entry
```

## Entry contract

```json
{
  "asset_id": "manual_income_asset_001",
  "asset_class": "fixed_income",
  "name": "Manual income asset",
  "principal": 1000.0,
  "currency": "BRL",
  "rate_type": "manual_estimate",
  "rate_value": 1.0,
  "maturity_date": null,
  "liquidity_date": null,
  "estimated_monthly_income": null,
  "source": "manual",
  "last_reviewed_at": "2026-05-25T12:00:00Z"
}
```

## Rate types

```text
fixed_rate
floating_rate
benchmark_linked
inflation_linked
manual_estimate
unknown
```

## Data to track

```text
asset name
asset class
principal or reference amount
currency
rate type
rate value
maturity date
liquidity date
issuer or source label
source type
manual assumptions
estimated payment schedule
risk notes
last review date
```

## Source types

```text
manual
provider
broker_read_only
imported_file
unknown
```

## Dashboard use

[`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md) may use this module to show:

```text
fixed-income allocation
estimated income from manual entries
manual assumptions panel
review-needed warnings
income target contribution
```

## Calendar use

[`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md) may include scheduled fixed-income or manual income events when a payment schedule is known.

If the schedule is uncertain, the event status should remain:

```text
estimated
unknown
```

## Reinvestment use

[`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md) may use fixed-income entries as:

```text
reserve yield assumption
stable-income assumption
manual contribution target
portfolio allocation component
```

The simulator must show when these values are assumptions.

## Risk checks

[`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md) should warn when:

```text
source is missing
source is manual and not dated
rate type is unknown
maturity is missing
liquidity is unknown
issuer or source risk is not classified
payment schedule is uncertain
last review date is old
income estimate is treated as guaranteed
```

## Output labels

Use:

```text
estimated income
manual assumption
provider-backed value
needs review
source unknown
```

Avoid:

```text
guaranteed income
risk-free income
automatic passive profit
```

## Future implementation notes

Possible future files:

```text
src/soturai/income/fixed_income_tracker.py
src/soturai/income/manual_entries.py
src/soturai/income/income_calendar.py
src/soturai/income/assumption_review.py
```

## Final rule

```text
Fixed-income tracking can support planning, but it must not hide assumptions or promise results.
```
