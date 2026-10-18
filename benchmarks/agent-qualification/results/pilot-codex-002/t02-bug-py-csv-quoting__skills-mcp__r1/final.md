Corrigido em `csvtool/parse.py` usando `csv.reader` da biblioteca padrão, sem dependências externas.

Os 5 testes passaram, incluindo novos casos com vírgulas entre aspas, aspas escapadas e campos vazios. `git diff --check` também passou.

STATUS: READY
VERIFIED: yes