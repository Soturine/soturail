import csv


def load(path):
    with open(path, encoding="utf-8", newline="") as handle:
        return [
            {"sku": row["sku"], "name": row["name"], "quantity": int(row["quantity"])}
            for row in csv.DictReader(handle)
        ]


def render_text(items, threshold):
    lines = []
    for item in sorted(items, key=lambda entry: entry["sku"]):
        line = f"{item['sku']}  {item['name']}  {item['quantity']}"
        if item["quantity"] < threshold:
            line += " LOW"
        lines.append(line)
    return "\n".join(lines)


def render_json(items, threshold):
    import json
    return json.dumps([
        {"sku": item["sku"], "name": item["name"], "quantity": item["quantity"], "low_stock": item["quantity"] < threshold}
        for item in sorted(items, key=lambda entry: entry["sku"])
    ], ensure_ascii=False)
