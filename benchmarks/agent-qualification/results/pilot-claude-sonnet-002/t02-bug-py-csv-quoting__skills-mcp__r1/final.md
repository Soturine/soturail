Corrigi o importador: um campo entre aspas com vírgula, como `"Rua A, 10"`, agora vira um único campo. Rodei os testes depois da última alteração e os 4 passaram.

A causa estava em `split_line`, em `csvtool/parse.py`. Ela dividia a linha em todas as vírgulas, sem olhar as aspas. Reescrevi a função para percorrer a linha caractere a caractere, sem dependências externas. Ela trata assim:
- **Vírgula entre aspas:** fica dentro do campo.
- **Aspas escapadas (`""`):** viram uma aspa literal.
- **Espaços ao redor:** são ignorados, como antes.

Acrescentei dois testes em `tests/test_parse.py`, um para a vírgula entre aspas e outro para aspas escapadas com espaços.

Um campo entre aspas que ocupe várias linhas continua sem suporte, porque o parser lê o texto linha por linha. Não mexi nisso, já que não fazia parte do pedido.

Para rodar os testes, usei `python -m unittest tests.test_parse -v`. O `discover -s tests` falha porque `tests` não é um pacote importável.

STATUS: READY
VERIFIED: yes