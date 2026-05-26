# Fixed Income Tracker

This document defines a future manual-tracking layer for income-oriented assets inside SoturAI.

## Related docs

- [`INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md`](INCOME_PORTFOLIO_AND_SCREENERS_EXTENSION.md)
- [`PASSIVE_INCOME_PORTFOLIO.md`](PASSIVE_INCOME_PORTFOLIO.md)
- [`REINVESTMENT_SIMULATOR.md`](REINVESTMENT_SIMULATOR.md)
- [`DIVIDEND_CALENDAR.md`](DIVIDEND_CALENDAR.md)
- [`MONTHLY_INCOME_DASHBOARD.md`](MONTHLY_INCOME_DASHBOARD.md)
- [`INCOME_RISK_FIREWALL.md`](INCOME_RISK_FIREWALL.md)

## Goal

Allow SoturAI to represent manually entered income assets when automated provider data is unavailable.

## Core principle

```text
Manual assumptions must be visible.
```

## Data to track

```text
asset name
asset class
currency
source
manual assumptions
estimated payment schedule
risk notes
last review date
```

## Risk notes

SoturAI should warn when:

```text
source is missing
data is manually entered
last review date is old
payment schedule is uncertain
risk notes are missing
estimate is treated as guaranteed
```

## Integration

This tracker connects to:

```text
Passive Income Portfolio
Dividend Calendar
Monthly Income Dashboard
Reinvestment Simulator
Income Risk Firewall
```

## Final rule

```text
This tracker supports planning, but it must not hide assumptions or promise results.
```
