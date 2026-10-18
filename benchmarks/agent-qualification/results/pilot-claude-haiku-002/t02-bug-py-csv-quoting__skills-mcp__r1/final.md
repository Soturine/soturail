Corrigi o importador: `split_line` agora respeita campos entre aspas, então vírgulas dentro delas não separam colunas. Nenhuma dependência nova foi adicionada.

**Causa:** `split_line` fazia `line.split(",")`, ignorando totalmente as aspas. `"Rua A, 10"` virava dois campos e a linha era rejeitada com `ValueError`.

**Mudança** (`csvtool/parse.py`): um pequeno scanner caractere a caractere que:
- trata vírgulas dentro de aspas como conteúdo;
- aceita `""` como aspa escapada;
- preserva espaços dentro de campos entre aspas e continua removendo espaços de campos sem aspas, como antes;
- trata aspa no meio de um campo sem aspas como caractere literal (`5"x` continua `5"x`).

**Testes** (`tests/test_parse.py`): adicionei 6 casos: vírgula em campo entre aspas, `""` escapado, espaços internos, campo vazio entre aspas, aspa literal em campo sem aspas e contagem de campos errada com vírgula entre aspas.

**Verificação:** `python -m unittest tests.test_parse -v` passa nos 8 testes. Com o `parse.py` original, 2 dos novos testes dão erro, confirmando que eles cobrem o bug.

**Limitação conhecida:** quebras de linha dentro de um campo entre aspas não são suportadas. O código lê o arquivo linha a linha (`splitlines`), então isso exigiria mudar a leitura do arquivo. Não era o problema relatado, então não mexi nisso.

Não usei `-I` nos testes, porque ele remove o diretório atual do `sys.path` e impede importar `csvtool`. Os arquivos `__pycache__` que já estavam não-rastreados não foram alterados.

STATUS: READY
VERIFIED: yes