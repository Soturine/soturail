Implementé `shippingFee` en `src/shipping.js` según R1–R5. Un caso queda sin resolver a propósito y lo registré en `OPEN_QUESTIONS.md`. La suite pasa: 8 de 8 tests.

**Implementado**
- **R1:** nacional (`country === "ES"`) con subtotal menor de 50 cuesta 4,90 €.
- **R2:** nacional con subtotal de 50 o más cuesta 0 €.
- **R3:** internacional cuesta 12 € más 1,50 € por cada kg completo por encima de 2 kg. Por ejemplo, 4,7 kg da 15 €.
- **R4:** el exprés suma 6 €. Un exprés internacional nunca es gratuito.
- **R5:** `weightKg` que no sea un número finito o sea negativo lanza `RangeError`.

**Sin resolver (OQ1)**
R2 y R4 chocan en un caso: un pedido exprés nacional con subtotal de 50 o más. R4 dice que el exprés "nunca es gratuito" y suma 6 €, pero su ejemplo dice que un exprés nacional de 60 € paga 0 €. Para ese caso, `shippingFee` lanza un `Error` que remite a `OPEN_QUESTIONS.md`, en lugar de devolver un importe que podría ser incorrecto. Eso significa que un checkout con ese pedido fallará hasta que se decida la regla.

**Decisiones mías que conviene revisar**
- Rechazo `Infinity` además de `NaN`, cadenas y negativos, porque no es un peso utilizable.
- La comparación de país es exacta: `"es"` se trata como internacional.
- El peso no afecta a la tarifa nacional, porque R1 no lo menciona.
- Añadí tests en `test/shipping.test.js` para cada regla. No estaban en la petición, pero sirven para comprobar el comportamiento.

No hice commit.

STATUS: NOT_READY
VERIFIED: yes