Implementé las reglas de envío en `shippingFee` y dejé sin resolver el único conflicto del documento de requisitos. Los 9 tests pasan (`npm test`).

**Conflicto sin resolver (Q1):** R2 dice que los pedidos nacionales con subtotal ≥ 50 € tienen envío gratis. R4 dice que el exprés "nunca es gratuito", pero su ejemplo dice que un exprés nacional de 60 € paga 0 €. Para ese caso concreto (nacional, exprés, subtotal ≥ 50) la función lanza un `Error` que apunta a `OPEN_QUESTIONS.md`, en lugar de adivinar una tarifa. Todos los demás casos siguen el documento.

**Implementado:**
- R1: nacional base 4,90 €.
- R2: nacional con subtotal ≥ 50 (inclusive) → 0 €.
- R3: internacional 12 € + 1,50 € por cada kg completo por encima de 2 kg. Internacional nunca es gratis.
- R4: exprés suma 6 € (nacional de 40 € exprés → 10,90 €).
- R5: `RangeError` si el peso es negativo o no es un número.
- El resultado se redondea a 2 decimales.

**Decisiones mías que conviene revisar:**
- Q2 (en `OPEN_QUESTIONS.md`): rechazo también `Infinity` con `Number.isFinite`. El documento solo dice "no es un número", así que es una lectura mía.
- El peso se valida en todos los casos, aunque un envío nacional no lo usa.
- No validé `subtotal` ni `country`, porque el documento no lo pide.

**Archivos:**
- `src/shipping.js`
- `test/shipping.test.js` (tests por regla, incluido el caso Q1)
- `OPEN_QUESTIONS.md` (nuevo)

No he hecho commit ni push.

STATUS: NOT_READY
VERIFIED: yes