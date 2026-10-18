export function updateUser(store, id, patch) {
  const current = store.get(id);
  if (!current) return { status: 404, errors: ["user: not found"] };
  const errors = [];
  const next = { ...current };
  if (patch.email !== undefined) {
    const email = typeof patch.email === "string" ? patch.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email: invalid");
    next.email = email;
  }
  if (patch.name !== undefined) {
    const name = typeof patch.name === "string" ? patch.name.trim() : "";
    if (name.length < 2 || name.length > 80) errors.push("name: must be 2-80 characters");
    next.name = name;
  }
  if (patch.age !== undefined && (!Number.isInteger(patch.age) || patch.age < 13 || patch.age > 130)) {
    errors.push("age: must be an integer between 13 and 130");
  }
  if (patch.age !== undefined) next.age = patch.age;
  if (errors.length) return { status: 422, errors };
  return { status: 200, user: store.replace(id, next) };
}
