# Pricing rules

- Orders with **10 or more** units of the same SKU get a 10% bulk discount on that line.
- Discounts never apply to items flagged `noDiscount`.
- Totals are rounded to cents only once, at the end of `orderTotal`.
- `placeOrder` resolves only after the order is persisted.
