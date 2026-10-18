import { orderTotal } from "./pricing.js";

export async function placeOrder(repo, order) {
  const total = orderTotal(order.lines);
  const saved = await repo.save({ ...order, total });
  return saved;
}
