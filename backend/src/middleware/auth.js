import jwt from "jsonwebtoken";

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
    req.user = decoded; // { email, name }
    next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
