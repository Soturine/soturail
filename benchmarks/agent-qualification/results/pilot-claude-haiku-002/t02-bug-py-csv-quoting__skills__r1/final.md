O importador agora lê corretamente campos entre aspas que contêm vírgula, como `"Rua A, 10"`.

**Causa:** `split_line` em `csvtool/parse.py` fazia `line.split(",")` antes de tratar as aspas. A vírgula dentro do endereço era tratada como separador, a linha ficava com um campo a mais e o `parse_customers` levantava `ValueError`. Reproduzi isso antes de mexer.

**Correção:** `split_line` usa `csv.reader` da biblioteca padrão, sem dependências novas. Ele trata aspas, vírgulas internas e `""` escapado. Mantive o `strip` de cada campo, como era antes. `skipinitialspace=True` ignora espaços antes da aspa de abertura.

**Testes:** adicionei dois casos em `tests/test_parse.py`: um com vírgula dentro de aspas e outro com aspas escapadas (`"A ""Ana"""`). A suíte passa com 4 testes e o caso original agora retorna `{'nome': 'Ana', 'endereco': 'Rua A, 10'}`.

**Limitação que não mudei:** o parser ainda trabalha linha a linha, porque `parse_customers` divide o texto com `splitlines()`. Um campo entre aspas que contém quebra de linha continua quebrado. Isso exigiria ler o arquivo como um todo com `csv.reader`, o que é uma mudança maior. Se o ERP exporta esse caso, vale abrir outra tarefa.

Os comandos de teste usados foram `python -m unittest tests.test_parse`. A descoberta padrão (`discover`) não funciona aqui porque `tests/` não tem `__init__.py`; isso já era assim antes da mudança.

STATUS: READY
VERIFIED: yes