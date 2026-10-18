`report` now accepts `--format {text,json}`. The default is still text, and the text output is unchanged. The unit tests pass (2 of 2), and I ran the CLI by hand in both formats.

Changes:
- **`inventory/report.py`**: new `render_json(items, threshold)`. It sorts by SKU and emits `sku`, `name`, `quantity`, and `low_stock` for each item, using `json.dumps` with `indent=2`.
- **`inventory/__main__.py`**: adds the `--format` option (choices `text` and `json`, default `text`) and picks the renderer from it.
- **`tests/test_report.py`**: new `test_json_report` checks the parsed JSON against the expected records for `data/stock.csv`.
- **`README.md`**: documents the option.

Choices I made that you may want to change:
- The JSON output is pretty-printed with two-space indentation. The spec didn't ask for that; it's easy to drop if you want compact output.
- I left `ensure_ascii` at its default, so non-ASCII names come out as `\uXXXX` escapes. This avoids console encoding problems on Windows. Passing `ensure_ascii=False` would print the characters directly.

I did not commit anything; the changes are in the working tree.

The test run used `python -m unittest tests.test_report`. Running `discover -s tests` fails with an import error both before and after this change, because the tests directory isn't a package. That's a pre-existing quirk, not something this change touched.

STATUS: READY
VERIFIED: yes