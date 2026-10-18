`python -m inventory report <csv> --format json` now works. The default text output is unchanged.

**Changes**
- `inventory/report.py`: added `render_json(items, threshold)`. It sorts by SKU and emits objects with `sku`, `name`, `quantity` (int), and `low_stock` (bool, `quantity < threshold`, the same rule the text output uses for `LOW`).
- `inventory/__main__.py`: added `--format {text,json}` with `text` as the default. The text branch still calls `render_text` as before.

**Choices I made**
- `low_stock` uses strict `<`, matching the existing text output, so a quantity equal to the threshold is not low stock.
- JSON is pretty-printed with 2-space indent and `ensure_ascii=False`, so non-ASCII names such as Japanese stay readable. The sample data is ASCII, so I did not test non-ASCII output.

**Verification (run after the last change)**
- Text output on `data/stock.csv` prints the same three lines as before, with `A-100  Anchor  3 LOW`.
- JSON output is a valid array sorted A-100, B-200, C-310. `A-100` has `low_stock: true`; the others have `false`.
- `--threshold 4` gives the same flags here, which is expected since no quantity is 4.
- An invalid `--format xml` exits with code 2 and a usage error.
- The repo has no test suite, so I did not run any tests. I ran with `python -m` without `-I`, because `-I` removes the working directory from `sys.path` and the package then can't be found. This is the user's own repo, not an untrusted download.

Only `inventory/report.py` and `inventory/__main__.py` changed. I did not commit.

STATUS: READY
VERIFIED: yes