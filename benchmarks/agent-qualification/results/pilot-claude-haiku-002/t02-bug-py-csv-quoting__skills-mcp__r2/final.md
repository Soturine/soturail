O importador agora lê campos entre aspas com vírgula, como `"Rua A, 10"`, sem dependências externas.

**Causa:** `split_line` em `csvtool/parse.py` dividia a linha com `line.split(",")`, sem considerar aspas. Uma vírgula dentro de um campo entre aspas virava separador e a contagem de campos não batia com o cabeçalho.

**Correção:** `split_line` usa o módulo `csv` da biblioteca padrão (`csv.reader` com `skipinitialspace=True`) e mantém o `strip()` dos campos. Assim as vírgulas entre aspas e o escape `""` são tratados corretamente.

**Testes:** adicionei dois casos em `tests/test_parse.py`: vírgula dentro de aspas e aspas escapadas (`"Ana ""Aninha"""`).
- Com a correção, os 4 testes passam.
- Com o `parse.py` original, `test_quoted_field_with_comma` falha, então ele cobre o bug. O teste de aspas escapadas já passava no código antigo.

**Observações:**
- `tests/` não tem `__init__.py`, então `python -m unittest discover -s tests` não funciona. Rodei com `python -m unittest tests.test_parse`. Não alterei a estrutura de testes.
- Campos com quebra de linha dentro das aspas continuam sem suporte, porque `parse_customers` ainda separa o texto por linhas antes de chamar `split_line`. Isso não estava no pedido, então deixei como está.

STATUS: READY
VERIFIED: yes