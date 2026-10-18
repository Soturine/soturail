import { paginate } from "./paginate.js";

export function search(catalog, query, { page = 1, pageSize = 20 } = {}) {
  const needle = query.trim().toLowerCase();
  const matches = catalog.filter((item) => item.name.toLowerCase().includes(needle));
  return paginate(matches, page, pageSize);
}
