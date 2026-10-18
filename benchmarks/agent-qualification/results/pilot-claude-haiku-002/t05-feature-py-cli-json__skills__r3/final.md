`python -m inventory report <csv> --format json` now works. The default text output is unchanged, and both tests pass.

- **`inventory/report.py`**: new `render_json(items, threshold)`. It sorts by SKU and returns an array of `{sku, name, quantity, low_stock}` objects, with `quantity` as an integer and `low_stock` as a boolean (`quantity < threshold`, same rule as the text output). `render_text` is untouched.
- **`inventory/__main__.py`**: `--format {text,json}` with `text` as the default.
- **`tests/test_report.py`**: added `test_json_report`, which checks the parsed JSON against the expected records for `data/stock.csv`.
- **`README.md`**: documents the new flag and the JSON shape.

Verification: `python tests/test_report.py -v` passes both tests. I also ran the CLI by hand: `--format json` prints the expected array, the default prints the same text as before, and an unknown format such as `xml` is rejected with exit code 2.

Note: `python -m unittest discover -s tests` fails with an ImportError because `tests/` has no `__init__.py`. That was already the case before my change, so I left it alone; the test file runs fine when invoked directly.

Changes are uncommitted in the working tree.

STATUS: READY
VERIFIED: yes