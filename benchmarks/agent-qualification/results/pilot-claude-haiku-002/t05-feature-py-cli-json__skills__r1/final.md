`report` now accepts `--format json`, and the default text output is unchanged. The tests pass and I checked both formats by running the CLI.

- **`inventory/report.py`**: new `render_json(items, threshold)` returns a JSON array sorted by SKU. Each object has `sku`, `name`, `quantity` (int), and `low_stock` (true when quantity is below the threshold). It uses `json.dumps` defaults, so non-ASCII names are escaped as `\uXXXX`. That keeps output safe on consoles with non-UTF-8 code pages, but the names are not readable raw in the output.
- **`inventory/__main__.py`**: `--format {text,json}` with `text` as the default. The text branch still calls `render_text` as before.
- **`tests/test_report.py`**: added `test_json_report`, which checks the parsed JSON for `data/stock.csv`.
- **`README.md`**: documented the new option.

Verification: `python -m unittest tests.test_report -v` passes both tests. I also ran `--format json` and the default text mode by hand. I did not commit anything. The untracked `__pycache__/` directories were already there before I started and I left them alone.

STATUS: READY
VERIFIED: yes