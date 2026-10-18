# importador-clientes

Importa clientes de arquivos CSV exportados pelo ERP.

Formato (RFC 4180 simplificado):

- primeira linha é o cabeçalho;
- campos separados por vírgula;
- campos podem estar entre aspas duplas; dentro de aspas, `""` representa uma aspa literal;
- linhas em branco são ignoradas;
- `parse_customers(text)` devolve uma lista de `dict` com as chaves do cabeçalho.

Testes: `python -m unittest discover -s tests`
