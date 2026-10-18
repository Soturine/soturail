# inventory

Usage: `python -m inventory report data/stock.csv [--threshold N]`

Prints one line per item sorted by SKU: `SKU  NAME  QTY` and appends ` LOW` when quantity is below the threshold (default 5).
