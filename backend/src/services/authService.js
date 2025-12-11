// Simple auth service — in real app, replace with DB lookup and password checks
function makeToken(email) {
  try {
    const b = Buffer.from(email || "").toString("base64");
    return `mock-token-${b}`;
  } catch (e) {
    return `mock-token-${Date.now()}`;
  }
}

export function login({ email, password } = {}) {
  if (!email) throw new Error("Email is required");
  const user = { name: "hello", email };
  const token = makeToken(email);
  return { user, token };
}

export function register({ name, email, password } = {}) {
  if (!email) throw new Error("Email is required");
  // Mock register — in real app, persist to DB and hash password
  const user = { name: name || "hello", email };
  const token = makeToken(email);
  return { user, token };
}

export function logout() {
  // In real apps this might clear server session or blacklist token.
  return { ok: true };
}
