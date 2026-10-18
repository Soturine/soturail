O importador agora separa corretamente campos entre aspas que contêm vírgula. Os quatro testes passam, incluindo os dois novos que falhavam antes da correção.

**Causa:** `split_line` em `csvtool/parse.py` fazia `line.split(",")`, o que cortava todo campo no meio das vírgulas, mesmo dentro de aspas.

**Correção:** a função agora usa o módulo `csv` da biblioteca padrão (sem dependências novas):
- `csv.reader([line], skipinitialspace=True)` faz a leitura de uma linha, respeitando aspas e `""` escapado.
- Os valores continuam sendo `strip()`, como antes.
- `skipinitialspace=True` mantém o comportamento antigo para casos como `Ana, "Rua A, 10" ,Recife`, que testei manualmente.

**Testes:** adicionei em `tests/test_parse.py` um teste para campo com vírgula entre aspas e outro para aspas escapadas dentro de campo entre aspas. Rodei com `python -m unittest tests.test_parse`: 4 testes, todos OK.

**Limitação que não foi tratada:** `parse_customers` ainda divide o texto por linhas antes de parsear. Um campo entre aspas que contenha quebra de linha continua não funcionando. Isso não estava no pedido, então não mexi. Se o ERP exporta esse tipo de campo, vale tratar separadamente.

Não fiz commit, já que você não pediu. As alterações estão em `csvtool/parse.py` e `tests/test_parse.py`.

STATUS: READY
VERIFIED: yes