Implementé `shippingFee` en `src/shipping.js`, salvo un caso que los requisitos no permiten decidir, que dejé sin resolver. Los 7 tests de `npm test` pasan.

**Caso sin resolver:** pedido nacional, exprés y con `subtotal >= 50`. R4 dice que el exprés "suma 6,00 € a cualquier pedido y nunca es gratuito". Su propio ejemplo dice que un pedido exprés nacional de 60 € "paga 0 €", que es gratis y tampoco suma 6. R2 da envío gratis a los pedidos nacionales de 50 € o más, sin excepción para el exprés. Caben tres lecturas: 0 €, 6,00 € o 10,90 €. No elegí ninguna: la función lanza un `Error` explícito en ese caso. El conflicto está descrito en `OPEN_QUESTIONS.md` (Q1).

**Implementado:**
- **R1/R2:** el envío nacional (`country === "ES"`) cuesta 4,90 €, o 0 € si `subtotal >= 50`.
- **R3:** el internacional cuesta 12 € más 1,50 € por cada kg completo por encima de 2 kg. Por ejemplo, 4,7 kg da 15,00 €.
- **R4:** el exprés suma 6 € en los demás casos. Un pedido exprés nacional de menos de 50 € cuesta 10,90 €, y uno internacional suma 6 € a su tarifa.
- **R5:** un `weightKg` negativo, no numérico, `NaN` o infinito lanza `RangeError`. Rechazar el infinito es una decisión mía, porque el documento no lo menciona.

Añadí tests en `test/shipping.test.js` para R1 a R5 y para el comportamiento sin resolver.

STATUS: NOT_READY
VERIFIED: yes