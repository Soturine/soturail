# catalog-search

Small search/pagination helpers used by the catalog API.

- `paginate(items, page, pageSize)` returns `{ items, page, pageSize, totalItems, totalPages }`.
- Pages are 1-based. An empty result has `totalPages: 0`.
- Requesting a page outside `1..totalPages` returns an empty `items` array (never throws).
- `pageSize` must be a positive integer; otherwise a `RangeError` is thrown.
