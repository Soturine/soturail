O importador agora lê campos entre aspas com vírgula corretamente, e a correção não adiciona dependências (usa o módulo `csv` da biblioteca padrão).

**Causa:** `split_line` fazia `line.split(",")`, então ignorava as aspas e partia `"Rua A, 10"` em dois campos. Com isso, a contagem de campos não batia com o cabeçalho e o parser lançava `ValueError: linha 2: esperado 2 campos, encontrado 3`. Reproduzi esse erro com o código original.

**Mudanças:**
- `csvtool/parse.py`: `split_line` usa `next(csv.reader([line]))` e aplica `strip()` em cada campo, como o código anterior fazia.
- `tests/test_parse.py`: três testes novos:
  - campo entre aspas com vírgula (`"Rua A, 10"`);
  - aspa escapada dentro de campo entre aspas (`""`);
  - campo com vírgula entre aspas que ainda conta como um só campo e dispara erro quando a contagem não bate.

**Verificação:** `python -m unittest discover -s tests` passa nos 5 testes (2 antigos e 3 novos).

**Decisões e limitações:**
- Mantive o processamento linha a linha, como antes. Um campo entre aspas que contenha quebra de linha continua não sendo suportado. O README não promete isso, mas vale saber.
- Com o `strip()` aplicado depois da leitura, espaços no início ou no fim de um valor entre aspas são removidos. No código antigo isso já acontecia para valores sem aspas, e o comportamento dos valores sem aspas foi preservado.

Não há mudanças de commit: as alterações estão no working tree, sem commit.

STATUS: READY
VERIFIED: yes