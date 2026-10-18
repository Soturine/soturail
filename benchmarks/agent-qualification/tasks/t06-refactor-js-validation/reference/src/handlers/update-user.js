import { validateUserFields } from "../validation.js";

export function updateUser(store, id, patch) {
  const current = store.get(id);
  if (!current) return { status: 404, errors: ["user: not found"] };
  const { errors, values } = validateUserFields(patch, { partial: true });
  if (errors.length) return { status: 422, errors };
  return { status: 200, user: store.replace(id, { ...current, ...values }) };
}
