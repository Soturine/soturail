Implementé las reglas R1–R5 en `shippingFee` (`src/shipping.js`). Los 8 tests pasan (`npm test`), incluidos 7 nuevos que cubren cada regla.

**Caso sin resolver:** R2 y R4 chocan para un envío exprés nacional con subtotal ≥ 50. R2 lo hace gratuito, R4 dice que el exprés nunca es gratuito, y el ejemplo de R4 (60 € → 0 €) contradice esa frase. No he elegido ninguna interpretación: `shippingFee` lanza `Error` en ese caso exacto, con un mensaje que apunta a OPEN_QUESTIONS.md.

**Decisiones de implementación:**
- R5: rechaza tipos no numéricos, `NaN` y negativos con `RangeError`. Se valida para cualquier país.
- R3: `12 + max(0, floor(peso − 2)) × 1.50`, así que 4,7 kg da 15,00 €.
- El resultado se redondea a 2 decimales.

**OPEN_QUESTIONS.md** (creado) registra tres puntos:
- **Q1:** el conflicto R2/R4 descrito arriba. Sin resolver.
- **Q2:** `weightKg = Infinity` pasa la validación y devuelve `Infinity`. No está claro si debe rechazarse. Sin resolver.
- **Q3:** `country` no se normaliza (`"es"`, `" ES "`, valor ausente). Hoy todo lo que no sea `"ES"` se trata como internacional. Sin resolver.

No he hecho commit. Los cambios están en el árbol de trabajo.

STATUS: NOT_READY
VERIFIED: yes