"""Leitura de CSV de clientes exportado pelo ERP."""
import csv
import io


def parse_customers(text):
    lines = [line for line in text.splitlines() if line.strip()]
    if not lines:
        return []
    rows = list(csv.reader(io.StringIO("\n".join(lines))))
    header = rows[0]
    customers = []
    for number, values in enumerate(rows[1:], start=2):
        if len(values) != len(header):
            raise ValueError(f"linha {number}: esperado {len(header)} campos, encontrado {len(values)}")
        customers.append(dict(zip(header, values)))
    return customers
