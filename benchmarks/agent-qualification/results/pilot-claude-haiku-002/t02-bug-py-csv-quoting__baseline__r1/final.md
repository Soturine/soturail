Corrigi o importador: vírgulas dentro de campos entre aspas não separam mais colunas. A correção usa só a biblioteca padrão.

**Causa:** `split_line` dividia a linha em todas as vírgulas, inclusive as que estavam dentro de aspas. `"Rua A, 10"` virava dois campos e a linha era rejeitada com "esperado N campos".

**Mudança** (`csvtool/parse.py`): a nova função `split_fields` percorre a linha, acompanha se está dentro de aspas e só divide em vírgulas que ficam fora delas. A lógica existente de `strip` e remoção de aspas (incluindo `""` como aspas escapadas) continua em `split_line`, sem alteração.

**Testes** (`tests/test_parse.py`): adicionei dois casos: um campo com vírgula (`"Rua A, 10"`) e um campo com aspas escapadas e vírgula (`"disse ""oi"", tudo bem"`). Os quatro testes passam (`python -m unittest tests.test_parse`).

Limitação que mantive: o parser ainda trabalha linha a linha, então um campo entre aspas que contenha quebra de linha não é suportado. Isso já era assim antes e não faz parte deste bug.

Não fiz commit.

STATUS: READY
VERIFIED: yes