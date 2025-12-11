// Simple in-memory store for pending registrations during OTP verification.
// Replace with a persistent store (e.g., Mongo) for production.

const pending = new Map(); // email -> { name, password }

export function setPending(email, data) {
  if (!email) return;
  pending.set(email.toLowerCase(), data);
}

export function getPending(email) {
  if (!email) return null;
  return pending.get(email.toLowerCase()) || null;
}

export function clearPending(email) {
  if (!email) return;
  pending.delete(email.toLowerCase());
}
