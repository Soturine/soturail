"""Leitura de CSV de clientes exportado pelo ERP."""


def split_line(line):
    fields = []
    for raw in line.split(","):
        value = raw.strip()
        if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
            value = value[1:-1].replace('""', '"')
        fields.append(value)
    return fields


def parse_customers(text):
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return []
    header = split_line(lines[0])
    customers = []
    for number, line in enumerate(lines[1:], start=2):
        values = split_line(line)
        if len(values) != len(header):
            raise ValueError(f"linha {number}: esperado {len(header)} campos, encontrado {len(values)}")
        customers.append(dict(zip(header, values)))
    return customers
