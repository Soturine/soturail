export function totalPages(totalItems, pageSize) {
  return Math.floor(totalItems / pageSize);
}

export function paginate(items, page, pageSize) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("pageSize must be a positive integer");
  }
  const pages = totalPages(items.length, pageSize);
  if (page < 1 || page > pages) {
    return { items: [], page, pageSize, totalItems: items.length, totalPages: pages };
  }
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: pages
  };
}
