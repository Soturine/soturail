export function createStore() {
  const users = new Map();
  let next = 1;
  return {
    insert(data) { const user = { id: next++, ...data }; users.set(user.id, user); return user; },
    get(id) { return users.get(id); },
    replace(id, user) { users.set(id, user); return user; }
  };
}
