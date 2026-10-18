Corrigido com `csv.reader`, da biblioteca padrão, sem dependências externas. Campos como `"Rua A, 10"` e aspas escapadas agora são interpretados corretamente.

Validação: 4 testes passaram com `python -m unittest discover -s tests`; `git diff --check` sem erros. Contrato SotuRail validado como `ready`.

STATUS: READY
VERIFIED: yes