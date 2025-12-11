import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

export default async function authMiddleware(req, res, next) {
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth || typeof auth !== "string") {
    return res.status(401).json({ error: "Missing Authorization header" });
  }
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid Authorization format" });
  }
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const email = payload?.email?.toLowerCase();
    if (!email) return res.status(401).json({ error: "Invalid token payload" });

    const existing = await User.findOne({ email });
    if (!existing) return res.status(401).json({ error: "User not found" });

    req.user = { email: existing.email, name: existing.name };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
