import { validateUserFields } from "../validation.js";

export function createUser(store, input) {
  const { errors, values } = validateUserFields(input);
  if (errors.length) return { status: 422, errors };
  return { status: 201, user: store.insert(values) };
}
