// In-memory settings per user
const store = new Map();

function ensure(email) {
  const e = (email || "").toLowerCase();
  if (!store.has(e)) store.set(e, { theme: "light" });
  return store.get(e);
}

export function getSettings(email) {
  return ensure(email);
}

export function updateSettings(email, patch) {
  const cur = ensure(email);
  const updated = { ...cur, ...patch };
  store.set((email||"").toLowerCase(), updated);
  return updated;
}
