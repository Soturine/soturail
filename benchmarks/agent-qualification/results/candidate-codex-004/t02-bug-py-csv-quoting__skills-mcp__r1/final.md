Corrigido usando `csv` da biblioteca padrão, sem dependências externas. Campos como `"Rua A, 10"` e aspas escapadas são interpretados corretamente.

Os 4 testes passaram via `soturail run -- python -m unittest discover -s tests`, incluindo os novos casos de regressão.

STATUS: READY
VERIFIED: yes