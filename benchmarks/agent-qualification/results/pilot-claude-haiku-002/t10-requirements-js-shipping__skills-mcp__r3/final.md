Implementé las reglas R1–R5 en `src/shipping.js`. El caso exprés nacional con subtotal ≥ 50 queda sin resolver porque R2 y R4 se contradicen, y lo registré en `OPEN_QUESTIONS.md`. Los 7 tests pasan (`soturail run npm test`).

**Qué hace `shippingFee`:**
- **R1/R2:** nacional (`country === "ES"`) cuesta 4,90 €, o 0 € si `subtotal >= 50`.
- **R3:** internacional cuesta 12,00 € + 1,50 € por cada kg completo por encima de 2 kg (`Math.floor(peso - 2)`, nunca negativo). Los internacionales nunca son gratuitos.
- **R4:** `express` suma 6,00 €.
- **R5:** peso negativo o no numérico lanza `RangeError`.
- **Sin resolver:** exprés nacional con subtotal ≥ 50 lanza `Error` explícito en lugar de elegir 0 € o 6 €.

**Decisiones que tomé (anotadas en `OPEN_QUESTIONS.md`):**
- Rechazo `Infinity` y `NaN` en el peso como provisional, porque R5 no los menciona.
- Tests nuevos en `test/shipping.test.js` para R1–R5 (excepto el caso sin resolver).

**Preguntas abiertas en `OPEN_QUESTIONS.md`:**
- Q1: conflicto R2 vs R4 (exprés nacional ≥ 50 €), sin resolver.
- Q2: confirmar el rechazo de `Infinity` en el peso.
- Q3: `subtotal` negativo o no numérico no está validado, y el requisito no dice qué hacer.
- Q4: qué cuenta como nacional (`"es"` en minúscula, `undefined`, etc.); ahora solo `"ES"` exacto es nacional.
- Q5: confirmar que los internacionales nunca son gratuitos.

No hice commit ni push.

STATUS: NOT_READY
VERIFIED: yes