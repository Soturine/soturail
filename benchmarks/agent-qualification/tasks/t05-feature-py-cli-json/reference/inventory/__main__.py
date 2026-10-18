import argparse
import sys

from .report import load, render_json, render_text


def main(argv=None):
    parser = argparse.ArgumentParser(prog="inventory")
    sub = parser.add_subparsers(dest="command", required=True)
    report = sub.add_parser("report")
    report.add_argument("path")
    report.add_argument("--threshold", type=int, default=5)
    report.add_argument("--format", choices=["text", "json"], default="text")
    args = parser.parse_args(argv)
    items = load(args.path)
    print(render_json(items, args.threshold) if args.format == "json" else render_text(items, args.threshold))
    return 0


if __name__ == "__main__":
    sys.exit(main())
