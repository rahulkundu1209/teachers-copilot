import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //console.warn("[auth] Missing or invalid auth header", authHeader);
    return res.status(401).json({ error: "Unauthorized - token required" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded?.email?.toLowerCase();
    if (!email) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    User.findOne({ email })
      .then((existing) => {
        if (!existing) {
          return res.status(401).json({ error: "User not found" });
        }

        req.user = {
          email: existing.email,
          name: existing.name,
          role: existing.role,
          department: existing.department,
        };
        next();
      })
      .catch(() => res.status(401).json({ error: "Invalid or expired token" }));
  } catch (err) {
    console.error("[auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
