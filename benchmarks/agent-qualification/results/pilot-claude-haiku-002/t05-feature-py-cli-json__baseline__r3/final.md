`python -m inventory report <csv> --format json` now works. It prints a JSON array sorted by SKU, with `sku`, `name`, `quantity` (integer), and `low_stock` (boolean) on each object. The default text output is unchanged, and the existing text test still passes.

Changes:
- **`inventory/report.py`**: new `render_json(items, threshold)`. `render_text` is untouched.
- **`inventory/__main__.py`**: `--format {text,json}` on the `report` subcommand, defaulting to `text`. Any other value is rejected by argparse with exit code 2.
- **`tests/test_report.py`**: new `test_json_report` that parses the output and checks each object.
- **`README.md`**: documents the flag and the JSON shape.

Choices I made:
- JSON is pretty-printed with `indent=2` and `ensure_ascii=False`, so non-ASCII names stay readable.
- The `--threshold` option applies to `low_stock` as it does to the text `LOW` marker.

Verification: `python -m unittest tests.test_report -v` passes both tests (Python 3.12.6). Running `python -m unittest discover -s tests -t .` fails on the environment's import path, which was already the case before my change, so I used the module form. I also ran the CLI by hand with `--format json`, with `--threshold 6`, and with an invalid format value.

I did not commit anything. The working tree has the four modified files plus the existing `__pycache__` files.

STATUS: READY
VERIFIED: yes