# Requisitos de envío

`shippingFee({ subtotal, country, weightKg, express })` devuelve la tarifa en euros (número con 2 decimales).

- **R1.** La tarifa base nacional (`country === "ES"`) es 4,90 €.
- **R2.** Los pedidos nacionales con `subtotal >= 50` tienen envío gratuito.
- **R3.** Los envíos internacionales (cualquier otro país) cuestan 12,00 € más 1,50 € por cada kg completo por encima de 2 kg (por ejemplo, 4,7 kg → 2 kg extra → 15,00 €).
- **R4.** El envío exprés suma 6,00 € a cualquier pedido y nunca es gratuito; un pedido exprés nacional de 60 € paga 0 €.
- **R5.** Si `weightKg` es negativo o no es un número, se lanza un `RangeError`.
