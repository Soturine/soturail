`python -m inventory report <csv> --format json` now works. The default is still `text`, and the text output is unchanged.

I ran it on `data/stock.csv`. It printed a JSON array sorted by SKU, and each object has `sku`, `name`, `quantity` (an integer) and `low_stock` (a boolean, true when the quantity is below `--threshold`).

I added a test for the JSON output in `tests/test_report.py`. Both tests pass with `python -m unittest tests.test_report`. `unittest discover -s tests` fails because `tests` has no `__init__.py`. That is how the repo was already set up, so I left it.

The changes are in `inventory/report.py` (a new `render_json`) and `inventory/__main__.py` (the new `--format` option).

STATUS: READY
VERIFIED: yes