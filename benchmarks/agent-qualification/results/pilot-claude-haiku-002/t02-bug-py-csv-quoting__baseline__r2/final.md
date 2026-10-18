O importador agora lê corretamente campos entre aspas que contêm vírgula, como `"Rua A, 10"`. Os 5 testes passam, incluindo os 3 novos.

**O que mudou**
- `csvtool/parse.py`: `split_line` deixou de usar `line.split(",")`, que ignorava as aspas. Agora usa `csv.reader` da biblioteca padrão, sem dependências externas. Os valores continuam sendo cortados com `strip()`, como antes.
- `tests/test_parse.py`: novos testes para vírgula dentro de aspas, aspas escapadas (`""`) e campo vazio entre aspas.

Antes da correção, a entrada `Ana,"Rua A, 10"` gerava o erro `esperado 2 campos, encontrado 3`. Não fiz commit.

**Limitação que não foi tratada:** `parse_customers` ainda divide o texto com `splitlines()` antes de interpretar as linhas. Por isso, um campo entre aspas com quebra de linha dentro dele continua quebrado. Isso não era o bug relatado, e o README já descreve o formato como "simplificado". Se for necessário, a mudança é ler o texto inteiro com `csv.reader` em vez de linha a linha.

STATUS: READY
VERIFIED: yes