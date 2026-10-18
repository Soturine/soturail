export function createUser(store, input) {
  const errors = [];
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("email: invalid");
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 80) errors.push("name: must be 2-80 characters");
  if (input.age !== undefined && (!Number.isInteger(input.age) || input.age < 13 || input.age > 130)) {
    errors.push("age: must be an integer between 13 and 130");
  }
  if (errors.length) return { status: 422, errors };
  const user = store.insert({ email, name, ...(input.age !== undefined ? { age: input.age } : {}) });
  return { status: 201, user };
}
