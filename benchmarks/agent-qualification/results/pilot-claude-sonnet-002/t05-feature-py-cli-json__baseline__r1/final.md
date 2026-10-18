`report` now takes `--format json`. It prints a JSON array of `sku`, `name`, `quantity` (integer) and `low_stock` (boolean) objects, sorted by SKU. The default `text` output is unchanged. The low-stock rule is the same as the text report's `LOW` marker (quantity below `--threshold`).

I ran it on `data/stock.csv` and it printed the three expected items, with only A-100 flagged low. Both tests pass, the existing text one and a new JSON one I added in `tests/test_report.py`. I ran them with `python -m unittest tests.test_report`, because `unittest discover` fails on `tests` ("Start directory is not importable"). That failure is a missing `__init__.py` in `tests/`, which I left alone.

The changes are in `inventory/report.py` and `inventory/__main__.py`.

STATUS: READY
VERIFIED: yes