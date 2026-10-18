Implementé `shippingFee` según `docs/requisitos-envio.md`. Las pruebas pasan (9/9), pero el caso exprés nacional con subtotal ≥ 50 € queda sin resolver a propósito, así que el trabajo no está completo.

**Conflicto registrado (Q1):** R4 dice que el exprés "nunca es gratuito" y suma 6 €, pero su ejemplo dice que un exprés nacional de 60 € paga 0 €. Para ese caso `shippingFee` lanza un `Error` explícito en vez de elegir una lectura. Un checkout que llame a la función con esos datos fallará hasta que alguien decida la regla.

**Cambios:**
- `src/shipping.js`: implementa R1–R5. R5 lanza `RangeError` para pesos negativos, `NaN`, no numéricos e `Infinity`. El resultado se redondea a 2 decimales.
- `OPEN_QUESTIONS.md` (nuevo): registra tres preguntas.
  - **Q1:** el conflicto R2/R4 descrito arriba (sin resolver).
  - **Q2:** si `Infinity` debe rechazarse como peso. Lo rechazo, pero es una decisión mía.
  - **Q3:** si el código de país debe normalizarse. Uso comparación literal con `"ES"`, así que `"es"` o `undefined` se tratan como internacionales.
- `test/shipping.test.js`: añade pruebas para R1–R5. La de Q1 solo confirma que el caso lanza error, no que el resultado sea correcto.

Comprobé el ejemplo de R3: 4,7 kg → 15,00 €. No hice commit.

STATUS: NOT_READY
VERIFIED: yes