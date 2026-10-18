Corrigi o importador: um campo entre aspas com vírgula, como `"Rua A, 10"`, agora vira um único campo. Os 3 testes passam, incluindo um novo para esse caso.

`split_line` em `csvtool/parse.py` fazia `line.split(",")`, que cortava dentro das aspas. Troquei por `csv.reader` da biblioteca padrão, então não há dependência nova. As aspas escapadas (`""`) continuam funcionando, e os espaços nas pontas dos campos continuam sendo removidos.

O novo teste, `test_quoted_comma` em `tests/test_parse.py`, cobre `"Rua A, 10"` e `"Diz ""oi"", ok"`.

O parser continua lendo linha por linha. Um campo entre aspas que contenha quebra de linha ainda não é suportado, como já era antes da correção.

STATUS: READY
VERIFIED: yes