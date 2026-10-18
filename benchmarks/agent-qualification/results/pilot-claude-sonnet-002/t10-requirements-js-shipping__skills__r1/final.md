Implementé `shippingFee` en `src/shipping.js`, salvo el envío exprés (R4), que dejé sin resolver porque se contradice.

- **R1 y R2:** el envío nacional (`"ES"`) cuesta 4,90 €, y es gratis si `subtotal >= 50`.
- **R3:** el internacional cuesta 12 € más 1,50 € por cada kg completo por encima de 2 kg. Interpreté "kg completo" como `floor(weightKg - 2)` con mínimo 0, así que 4,7 kg da 15,00 €.
- **R5:** `weightKg` negativo, no numérico, `NaN` o infinito lanza `RangeError`. Esto incluye `undefined`.
- **R4 (sin resolver):** el documento dice que el exprés "suma 6,00 € a cualquier pedido y nunca es gratuito", pero también que un pedido exprés nacional de 60 € "paga 0 €". Las dos frases no pueden cumplirse a la vez. Lo registré en `OPEN_QUESTIONS.md` (Q1). La función lanza un `Error` explícito cuando `express` es `true`, en lugar de elegir 6 € o 0 €. Hace falta una decisión de negocio.

Comprobé a mano los casos de R1, R2, R3 y R5, y `npm test` pasa. Ese test solo comprueba que la función existe. No añadí tests de las reglas.

STATUS: NOT_READY
VERIFIED: yes