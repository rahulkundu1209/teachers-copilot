export async function profile(req, res) {
  // authMiddleware should populate req.user
  const user = req.user || null;
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
}
