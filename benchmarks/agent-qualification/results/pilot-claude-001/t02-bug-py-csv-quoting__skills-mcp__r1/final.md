Corrigi o importador: agora um campo entre aspas como `"Rua A, 10"` é lido como um único campo. Os 3 testes passam, incluindo o novo para esse caso.

A causa era que `split_line` em `csvtool/parse.py` dividia a linha em cada vírgula, mesmo dentro das aspas. Troquei isso pelo módulo `csv` da biblioteca padrão, então não há dependência nova. `parse_customers` agora lê o texto inteiro com `csv.reader`, o que também aceita aspas escapadas (`""`) e campos com quebra de linha dentro das aspas.

O comportamento anterior continua: linhas em branco são ignoradas, os espaços das pontas são removidos e uma linha com número errado de campos gera `ValueError`. A mensagem do erro agora usa a linha física do arquivo, que difere da numeração antiga se houver campos com quebra de linha.

Adicionei `test_quoted_comma` em `tests/test_parse.py`, com uma vírgula e aspas escapadas dentro de campos entre aspas.

STATUS: READY
VERIFIED: yes