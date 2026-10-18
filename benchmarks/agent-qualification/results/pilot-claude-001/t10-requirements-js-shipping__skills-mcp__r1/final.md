Implementé R1, R2, R3 y R5 en `shippingFee`, pero dejé R4 (exprés) sin resolver a propósito porque se contradice. Los 5 tests pasan con `npm test`.

**Conflicto en R4.** El documento dice que el exprés "suma 6,00 € a cualquier pedido y nunca es gratuito". A la vez dice que un pedido exprés nacional de 60 € paga 0 €. Hay tres lecturas posibles:
- **A:** tarifa normal más 6, o sea 6,00 € para ese pedido.
- **B:** el exprés anula el envío gratis, o sea 10,90 €.
- **C:** vale el ejemplo de 0 € y la frase general sobra.

No elegí ninguna. Cuando `express` es `true`, `shippingFee` lanza un `Error` que remite a la pregunta Q1 de `OPEN_QUESTIONS.md`, donde está el conflicto explicado. Hace falta que negocio decida cuál es la correcta.

**Reglas implementadas:**
- **R1/R2:** si el país es `ES`, la tarifa es 4,90 €, y 0 € cuando `subtotal >= 50`.
- **R3:** para cualquier otro país son 12,00 € más 1,50 € por cada kg completo por encima de 2 kg. Así, 4,7 kg da 15,00 €.
- **R5:** lanza `RangeError` si `weightKg` es negativo o no es un número.

Fui más estricto que R5 en un punto: también rechazo `NaN` e `Infinity`. No validé `subtotal` porque ningún requisito lo pide. Lo dejé anotado en `OPEN_QUESTIONS.md`.

Añadí tests para R1, R2, R3 y R5, y uno que comprueba que el exprés sigue sin resolver.

STATUS: NOT_READY
VERIFIED: yes