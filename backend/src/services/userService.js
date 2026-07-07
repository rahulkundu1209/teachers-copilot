import bcrypt from "bcryptjs";
import User from "../models/User.js";

export async function createUser({ name, email, password, role = "teacher", department = "" }) {
  if (!email || !password) throw new Error("Email and password required");
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("User already exists");
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name || "",
    email: email.toLowerCase(),
    passwordHash,
    role,
    department: department || "",
  });
  return { name: user.name, email: user.email, role: user.role, department: user.department };
}

export async function getUserByEmail(email) {
  if (!email) return null;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return null;
  return { name: user.name, email: user.email, passwordHash: user.passwordHash, role: user.role, department: user.department };
}

export async function verifyCredentials({ email, password }) {
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return null;
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return null;
  return { name: user.name, email: user.email, role: user.role, department: user.department };
}
