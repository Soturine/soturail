Implementé `shippingFee` en `src/shipping.js` con todas las reglas salvo un caso que dejé sin resolver. Ese caso es el pedido exprés nacional con `subtotal >= 50`. Lo registré en `OPEN_QUESTIONS.md` como Q1.

**El conflicto:** R4 dice que el exprés «suma 6 €» y «nunca es gratuito». Su propio ejemplo dice que un pedido exprés nacional de 60 € paga 0 €. Además, R2 da envío gratuito a ese pedido. Las tres afirmaciones no pueden cumplirse a la vez. Con esas lecturas, el resultado sería 6 €, 0 € o 10,90 €, y no elegí ninguna. En ese caso `shippingFee` lanza un `Error`, hasta que alguien decida cuál es la correcta.

**Lo que sí quedó implementado:**
- **R1/R2:** el envío nacional cuesta 4,90 €, y es gratis con `subtotal >= 50`.
- **R3:** el internacional cuesta 12 € más 1,50 € por cada kg completo por encima de 2 kg.
- **R4:** el exprés suma 6 €, salvo en el caso sin resolver.
- **R5:** un `weightKg` negativo, `NaN` o que no sea número lanza `RangeError`.

**Comprobaciones:** ejecuté `npm test` (pasa) y probé a mano varios casos. Los resultados fueron 4,90 € nacional, 0 € con subtotal 50, 15,00 € para 4,7 kg internacional, 10,90 € exprés nacional bajo 50 € y 18,00 € exprés internacional. Los pesos inválidos lanzan `RangeError` y el caso sin resolver lanza el error. El único test que existe solo comprueba que la función se exporta, así que no añadí tests nuevos.

STATUS: NOT_READY
VERIFIED: yes