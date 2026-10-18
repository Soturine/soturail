from .parse import parse_customers


def import_file(path):
    with open(path, encoding="utf-8") as handle:
        return parse_customers(handle.read())
