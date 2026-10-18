Corrigi o importador: um campo entre aspas com vírgula, como `"Rua A, 10"`, agora vira um único campo. Os 3 testes passam, incluindo um novo para esse caso.

A causa era `split_line` em `csvtool/parse.py`, que quebrava a linha em cada vírgula antes de olhar as aspas. Troquei isso pelo módulo `csv` da biblioteca padrão, então não há dependência nova. `parse_customers` agora lê o texto inteiro com `csv.reader`. Isso trata também aspas escapadas (`""`) e campos entre aspas com quebra de linha. As linhas em branco continuam ignoradas, e a mensagem de erro de contagem de campos continua igual.

O novo teste está em `tests/test_parse.py` (`test_quoted_comma`). Ele cobre `"Rua A, 10"` e `"Disse ""oi"", ok"`.

Uma mudança pequena de comportamento: o código antigo removia espaços no início e no fim de cada campo. Agora só removo os espaços logo depois da vírgula. Espaços no fim de um campo sem aspas, como `Ana ,Recife`, passam a ser mantidos. Se o ERP exporta assim, dá para voltar a aparar.

STATUS: READY
VERIFIED: yes