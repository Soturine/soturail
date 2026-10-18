Implementé las reglas R1–R5 en `shippingFee` (`src/shipping.js`). Un caso queda sin resolver porque los requisitos se contradicen, así que no está listo para producción tal cual.

**Conflicto sin resolver:** un envío exprés nacional con subtotal ≥ 50 €. R2 lo hace gratis, R4 dice que el exprés nunca es gratis, y el ejemplo de R4 (60 € → 0 €) sigue a R2 y contradice su propia frase. La función lanza un `Error` explícito para este caso y no elige ningún importe. Lo he documentado en `OPEN_QUESTIONS.md` y hay un test que lo fija. Hasta que alguien decida, estos pedidos no se pueden cotizar. Si prefieres otro comportamiento temporal (por ejemplo, devolver 6 € o 0 €), dímelo y lo cambio.

**Otras dos preguntas abiertas** (también en `OPEN_QUESTIONS.md`), sin decidir:
- `weightKg = Infinity` no lanza `RangeError` con la regla literal de R5; para internacional devuelve `Infinity`.
- La comparación de `country` es exacta: `"es"` o `" ES"` se tratan como internacionales.

**Decisiones de implementación que tomé:**
- R5 se aplica siempre, también a pedidos nacionales. `NaN` y `undefined` cuentan como "no es un número".
- Los kg extra usan `floor(peso − 2)`, de modo que 4,7 kg → 15,00 €.
- El resultado se redondea a 2 decimales.
- Añadí tests para cada regla en `test/shipping.test.js`.

**Verificación:** `npm test` pasa 8/8 tras el último cambio. No he hecho commit.

STATUS: NOT_READY
VERIFIED: yes