Implementé `shippingFee` en `src/shipping.js` con todas las reglas salvo un caso, que queda sin resolver porque el requisito se contradice. Los 6 tests pasan con `npm test`.

**El conflicto está en R4 y R2.** Para un pedido exprés nacional con `subtotal >= 50`, R4 dice a la vez que el exprés "suma 6,00 € a cualquier pedido" y que "nunca es gratuito", lo que da 6,00 €. Su propio ejemplo (60 € exprés nacional) dice que paga 0 €. Además, R2 da envío gratis desde 50 €. No sé si debe cobrar 6,00 € o 0,00 €, así que no elegí.

- **Qué hace el código en ese caso:** lanza un `Error` explícito. Está registrado en `OPEN_QUESTIONS.md`, y un test comprueba que se lanza.
- **Qué se necesita:** que el responsable de negocio decida entre 6,00 € y 0,00 €.

**Lo demás está implementado:**
- **R1 y R2:** nacional 4,90 €, gratis con `subtotal >= 50`.
- **R3:** internacional 12 € más 1,50 € por kg completo por encima de 2 kg.
- **R4:** el exprés suma 6 € en los demás casos.
- **R5:** `RangeError` si `weightKg` es negativo o no es un número.

Asumí dos cosas menores, anotadas en `OPEN_QUESTIONS.md`: `NaN` e `Infinity` también lanzan `RangeError`, y los kg completos son `floor(weightKg - 2)` con mínimo 0. Añadí tests en `test/shipping.test.js`.

STATUS: NOT_READY
VERIFIED: yes