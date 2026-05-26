# Dividend Calendar

This document defines the income-event calendar for SoturAI's passive-income layer.

The calendar tracks expected, announced, confirmed and recorded income events for FIIs, dividend stocks, ETFs, REITs, fixed-income entries and manual entries.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`FII_INCOME_RADAR.md`](FII_INCOME_RADAR.md)
- [`DIVIDEND_STOCK_RADAR.md`](DIVIDEND_STOCK_RADAR.md)
- [`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md)
- [`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md)
- [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md)

## Core principle

```text
Estimated income, announced income and recorded income are different things.
```

SoturAI must keep these statuses separated.

## Supported events

```text
FII distributions
stock dividends
ETF distributions
REIT distributions, future
fixed-income payment entries
manual income entries
cash or reserve yield entries
```

## Status values

```text
estimated
announced
confirmed
recorded
cancelled
unknown
```

## Event contract

```json
{
  "event_id": "uuid",
  "symbol": "HGLG11",
  "asset_class": "FII",
  "event_type": "distribution",
  "declared_date": "2026-05-01",
  "ex_date": "2026-05-10",
  "payment_date": "2026-05-20",
  "amount_per_share": 1.0,
  "currency": "BRL",
  "source": "provider_or_manual",
  "status": "announced",
  "created_at": "2026-05-01T12:00:00Z"
}
```

## Calendar views

The dashboard should support:

```text
current month estimated income
next month estimated income
12-month income history
income by payment date
income by asset
income by asset class
income by status
changed payment alerts
non-recurring income notes
```

## Integration with dashboard

[`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md) should use this calendar to show:

```text
monthly target progress
expected payments
recorded payments
pending payments
income gaps
income by asset
income by asset class
status of each income event
```

## Integration with simulator

[`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md) should use calendar data to estimate reinvestment timing.

If an event is only estimated, the simulator must show that the projection depends on assumptions.

## Risk routing

Route calendar concerns to [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md) when:

```text
estimated event is treated as confirmed
announced value is far below recent history
event was cancelled
source is missing
non-recurring event is treated as recurring
provider data is stale
manual entry is missing source or date
```

## Final rule

```text
The calendar is not only about dates.
It is about separating expected, announced and recorded income.
```
