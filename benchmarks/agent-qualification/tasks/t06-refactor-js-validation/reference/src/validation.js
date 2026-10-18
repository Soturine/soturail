const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserFields(input, { partial = false } = {}) {
  const errors = [];
  const values = {};
  if (!partial || input.email !== undefined) {
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) errors.push("email: invalid");
    values.email = email;
  }
  if (!partial || input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 2 || name.length > 80) errors.push("name: must be 2-80 characters");
    values.name = name;
  }
  if (input.age !== undefined) {
    if (!Number.isInteger(input.age) || input.age < 13 || input.age > 130) errors.push("age: must be an integer between 13 and 130");
    values.age = input.age;
  }
  return { errors, values };
}
