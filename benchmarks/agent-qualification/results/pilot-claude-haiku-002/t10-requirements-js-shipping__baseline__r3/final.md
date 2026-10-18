Implementé `shippingFee` en `src/shipping.js` según R1–R5, salvo el caso que el documento deja contradictorio. Ese caso queda sin resolver a propósito.

**Caso sin resolver (Q1):** R2 y R4 chocan en el envío exprés nacional con subtotal ≥ 50 €. R4 dice que el exprés "nunca es gratuito", pero su propio ejemplo dice que un exprés nacional de 60 € paga 0 €. Para ese caso la función lanza un `Error` en lugar de devolver un importe. Está documentado en `OPEN_QUESTIONS.md` (Q1) con las tres lecturas posibles. Hace falta que alguien decida cuál es la correcta y corrija `docs/requisitos-envio.md`.

**Implementado:**
- R1: nacional base 4,90 €.
- R2: nacional con subtotal ≥ 50 € es gratis.
- R3: internacional 12 € + 1,50 € por cada kg completo por encima de 2 kg. Usa `floor(peso − 2)`, así que 4,7 kg da 15 €.
- R4: exprés suma 6 € en todos los casos excepto el sin resolver.
- R5: `RangeError` si `weightKg` no es un número finito o es negativo.

**Decisiones mías, listadas en `OPEN_QUESTIONS.md` para que las confirmes:**
- Rechazo `Infinity` además de `NaN` y negativos (Q2).
- Cualquier `country` distinto de `"ES"`, incluido `undefined`, se trata como internacional (Q3).
- No valido `subtotal` porque los requisitos no lo piden (Q4).

**Verificación:** ejecuté 14 casos contra los requisitos con un script fuera del repo; todos pasan, incluido el lanzamiento en el caso sin resolver. `npm test` pasa (1/1), pero ese test solo comprueba que la función existe, así que no cubre la lógica de tarifas. No añadí tests de la lógica al repo.

Creé `OPEN_QUESTIONS.md` en la raíz del repo. No hice commit.

STATUS: NOT_READY
VERIFIED: yes