Corrigido em `csvtool/parse.py` usando `csv.reader`, da biblioteca padrão, sem dependências externas.

Os 4 testes passaram, incluindo regressões para `"Rua A, 10"`, aspas escapadas e cabeçalhos entre aspas. `git diff --check` também passou.

STATUS: READY
VERIFIED: yes