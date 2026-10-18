Corrigi o importador: campos entre aspas com vírgula (como `"Rua A, 10"`) agora ficam inteiros. A correção usa o módulo `csv` da biblioteca padrão, sem dependências novas.

**Causa:** `split_line` em `csvtool/parse.py` fazia `line.split(",")` antes de olhar as aspas, então a vírgula dentro do campo virava separador.

**Mudanças:**
- `csvtool/parse.py`: `parse_customers` usa `csv.reader` sobre o texto inteiro. Isso também trata `""` escapado e quebras de linha dentro de campos entre aspas. A função `split_line` foi removida; ela só era usada aqui.
- `tests/test_parse.py`: três testes novos cobrindo vírgula dentro de aspas, aspas escapadas e linhas em branco.

**Decisões que tomei:**
- Os valores continuam sendo cortados com `strip()`, como antes. Consequência: espaços que estavam dentro de aspas nas bordas do campo também são removidos. Antes eram preservados. É um caso raro; se for importante, me avise.
- A mensagem de erro de contagem de campos ainda usa a numeração de linha da versão anterior (linhas não vazias, a partir de 2).

**Verificação:**
- `python -m unittest tests.test_parse -v`: 5 testes, todos OK.
- Importação de ponta a ponta com um arquivo contendo `Ana,"Rua A, 10"` via `import_file`: resultado `{'nome': 'Ana', 'endereco': 'Rua A, 10'}`.
- A alteração não foi commitada.

Não rodei a suíte com `python -m unittest discover`, porque a descoberta não encontra o pacote `csvtool` a partir de `tests/`. Isso já acontecia antes da mudança.

STATUS: READY
VERIFIED: yes