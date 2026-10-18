Implementé `shippingFee` en `src/shipping.js` con R1, R2, R3 y R5. R4 queda implementado salvo un caso, que dejé sin resolver. Los 7 tests pasan con `npm test`.

**Caso sin resolver:** R4 se contradice. Dice que el exprés "suma 6,00 € a cualquier pedido y nunca es gratuito", pero su propio ejemplo dice que un pedido exprés nacional de 60 € paga 0 €. Las respuestas posibles son 0 €, 6 € o 10,90 €. No elegí ninguna: `shippingFee` lanza un `Error` explícito cuando el país es `"ES"`, hay exprés y `subtotal >= 50`. El conflicto está descrito en `OPEN_QUESTIONS.md` (Q1).

**Casos exprés que sí implementé:**
- Nacional con `subtotal < 50`: 4,90 € + 6,00 € = 10,90 €.
- Internacional: tarifa de R3 + 6,00 €.

**Supuestos menores**, anotados también en `OPEN_QUESTIONS.md`:
- Los "kg completos por encima de 2 kg" se calculan como `floor(weightKg - 2)`, con mínimo 0.
- Un peso `NaN`, `Infinity`, `undefined` o una cadena lanza `RangeError`, además de los negativos.
- El país se compara exactamente con `"ES"`, así que `"es"` cuenta como internacional.

Añadí tests para cada regla y para el caso sin resolver en `test/shipping.test.js`.

STATUS: NOT_READY
VERIFIED: yes