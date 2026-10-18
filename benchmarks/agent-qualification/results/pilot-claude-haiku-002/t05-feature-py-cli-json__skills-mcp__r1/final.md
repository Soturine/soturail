`report` now accepts `--format json`. The default text output is unchanged, and the unit tests pass.

- **`inventory/report.py`**: new `render_json()`. It sorts by SKU and emits `sku`, `name`, `quantity` (int), and `low_stock` (bool). `low_stock` uses the same `quantity < threshold` rule as the ` LOW` marker in text output, so the two formats agree.
- **`inventory/__main__.py`**: `--format {text,json}`, default `text`. Any other value is rejected by argparse.
- **`tests/test_report.py`**: added `test_json_report`, which checks the parsed JSON for `data/stock.csv`. The existing text test is untouched.
- **`README.md`**: documented the flag and the JSON shape.

Verification: `python -m unittest tests.test_report -v` reports 2 tests, both OK. I also ran the CLI by hand: `--format json` prints the expected array, the default prints the same text as before, and `--format xml` exits with an argparse error.

I did not commit anything. The `__pycache__/` directories were already untracked before I started. I did not use the SotuRail tooling, since this change didn't need it.

STATUS: READY
VERIFIED: yes