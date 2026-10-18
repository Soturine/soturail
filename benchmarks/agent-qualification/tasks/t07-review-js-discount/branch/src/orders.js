import { orderTotal } from "./pricing.js";

export async function placeOrder(repo, order, audit) {
  const total = orderTotal(order.lines);
  const saved = repo.save({ ...order, total });
  await audit.record("order.placed", { id: order.id, total });
  return saved;
}
