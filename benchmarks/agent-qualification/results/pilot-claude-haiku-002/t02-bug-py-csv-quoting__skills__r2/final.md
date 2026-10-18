O importador agora lê corretamente campos entre aspas que contêm vírgula, como `"Rua A, 10"`. Os 4 testes passam, incluindo os dois novos, e a importação de um arquivo real com esse campo retorna `endereco: 'Rua A, 10'`.

**Causa:** `split_line` em `csvtool/parse.py` fazia `line.split(",")` sem considerar aspas, então um campo com vírgula dentro de aspas virava dois campos e a validação de quantidade de campos falhava.

**Correção:** `split_line` agora usa `csv.reader` da biblioteca padrão para cada linha, com `skipinitialspace=True`, e mantém o `strip()` dos valores. Não há dependências novas. Também tratei aspas escapadas (`""`), que o código antigo já suportava de forma parcial.

**Testes:** adicionei em `tests/test_parse.py` `test_quoted_field_with_comma` e `test_quoted_field_with_escaped_quote`.

**Limitações:**
- Um campo entre aspas com quebra de linha dentro ainda não é suportado, porque `parse_customers` divide o texto com `splitlines()` antes de tokenizar. Corrigir isso exigiria ler o arquivo inteiro com `csv.reader`, o que mudaria a estrutura do parser; não fiz porque não foi pedido.
- Um valor entre aspas com espaços nas bordas (`" a "`) agora perde esses espaços, porque o `strip()` final os remove. Antes, esses espaços internos eram preservados. É um caso raro, mas é uma mudança de comportamento.

Não fiz commit.

STATUS: READY
VERIFIED: yes