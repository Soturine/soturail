`report` now accepts `--format json`. The default text output is unchanged, and the tests pass.

**Changes**
- `inventory/report.py`: new `render_json(items, threshold)`. It sorts by SKU ascending and emits `sku`, `name`, `quantity` (int), and `low_stock` (bool, `quantity < threshold`, the same rule the text output uses for `LOW`). It uses `indent=2` and `ensure_ascii=False`, so non-ASCII names stay readable. Neither choice was specified, so say if you want compact output or escaped characters.
- `inventory/__main__.py`: `--format {text,json}`, defaulting to `text`. The text path is untouched.
- `tests/test_report.py`: added `test_json_report`, which checks the parsed JSON for `data/stock.csv`.

**Verification**
- `python -m unittest tests/test_report.py -v`: both tests pass (text and json).
- Manual run of `--format json` gives the expected array, sorted A-100, B-200, C-310, with `A-100` flagged `low_stock: true`.
- Manual run without `--format` prints the same text as before.

Nothing is committed; the changes are in the working tree on `main`.

STATUS: READY
VERIFIED: yes