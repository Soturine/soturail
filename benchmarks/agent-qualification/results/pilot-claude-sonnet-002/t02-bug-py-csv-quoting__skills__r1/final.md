O importador agora lê corretamente campos entre aspas que contêm vírgula, como `"Rua A, 10"`. Os 3 testes passam depois da última alteração, incluindo um teste novo para esse caso.

A correção está em `csvtool/parse.py`. O `split_line` dividia cada linha em todas as vírgulas, sem olhar as aspas. Troquei isso pelo módulo `csv` da biblioteca padrão, então não há dependência nova. O teste novo, `test_quoted_comma`, está em `tests/test_parse.py`. Ele cobre o endereço com vírgula e aspas escapadas como `""`.

Duas mudanças de comportamento:
- **Número da linha no erro:** a mensagem de "campos inesperados" agora usa o número da linha física no arquivo. Antes, as linhas em branco não entravam na contagem.
- **Quebra de linha dentro de aspas:** um campo entre aspas com quebra de linha agora é aceito como um único campo.

O `split_line` continua existindo, mas o `parse_customers` não o usa mais.

STATUS: READY
VERIFIED: yes