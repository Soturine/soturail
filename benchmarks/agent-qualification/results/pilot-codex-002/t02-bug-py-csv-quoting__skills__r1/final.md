Corrigido em `csvtool/parse.py`: vírgulas dentro de aspas agora permanecem no campo, sem dependências externas.

Adicionei testes para vírgulas, aspas escapadas, campos vazios e espaços. Os 4 testes passaram após a alteração; `git diff --check` também passou.

STATUS: READY
VERIFIED: yes