He implementado `shippingFee` según `docs/requisitos-envio.md`. Hay un caso contradictorio que dejé sin resolver: el envío exprés nacional con subtotal >= 50. La suite de tests pasa (9/9) tras el último cambio.

**Cambios**
- `src/shipping.js`: implementa R1–R5.
  - R1/R2: nacional 4,90 €, gratis con subtotal >= 50.
  - R3: internacional 12 € + 1,50 € por kg completo por encima de 2 kg.
  - R4: +6 € en exprés.
  - R5: `RangeError` si el peso no es un número finito o es negativo.
- `test/shipping.test.js`: añade un test por regla, más uno para el caso sin resolver.
- `OPEN_QUESTIONS.md` (nuevo): registra el conflicto y dos puntos menores.

**Caso sin resolver**
R4 dice que el exprés nunca es gratuito, pero su propio ejemplo (exprés nacional de 60 € paga 0 €) y R2 dicen lo contrario. Para ese caso `shippingFee` lanza un `Error` que remite a `OPEN_QUESTIONS.md`, en lugar de devolver 0 € o 6 €. Hay que confirmar cuál de las dos reglas vale.

**Decisiones mías (también anotadas en `OPEN_QUESTIONS.md`)**
- `Infinity` como peso lanza `RangeError`, porque R5 solo habla de negativos y no numéricos.
- Los requisitos no cubren `subtotal` negativo o no numérico; el código lo trata como "< 50".
- El código de país solo es nacional si es exactamente `"ES"`, por lo que `"es"` cuenta como internacional.

No he hecho commit ni push.

STATUS: NOT_READY
VERIFIED: yes