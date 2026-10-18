Corrigi o importador: um campo entre aspas com vírgula, como `"Rua A, 10"`, agora vem inteiro em um único campo. Os 3 testes passam, incluindo um novo para esse caso.

Em `csvtool/parse.py`, troquei a divisão manual por `,` pelo módulo `csv` da biblioteca padrão, então não há dependência nova. Aspas duplicadas dentro de um campo (`""`) continuam funcionando.

Duas mudanças de comportamento além do que você pediu:
- **Quebras de linha entre aspas:** um campo entre aspas pode conter quebra de linha sem partir o registro.
- **Espaços nas pontas:** os espaços depois da vírgula ainda são ignorados, mas espaços no fim de um campo sem aspas agora são mantidos. Antes eram removidos.

Linhas em branco continuam ignoradas, e o erro de contagem de campos continua informando o número da linha.

STATUS: READY
VERIFIED: yes