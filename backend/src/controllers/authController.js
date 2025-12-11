import jwt from "jsonwebtoken";
import { createUser, verifyCredentials, getUserByEmail } from "../services/userService.js";
import { createAndSendOtp, verifyAndConsumeOtp } from "../services/otpService.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    const user = await createUser({ name, email, password });
    return res.status(201).json({ user });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Register failed" });
  }
}

// Registration Step 1: verify input, ensure user not exists, send OTP, and stash pending data
export async function registerRequestOtp(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ error: "User already exists" });

    await createAndSendOtp({ email, purpose: "register", payload: { name, password } });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not send OTP" });
  }
}

// Registration Step 2: verify OTP, create user, issue JWT
export async function registerVerifyOtp(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });
    const result = await verifyAndConsumeOtp({ email, code, purpose: "register" });
    if (!result.ok) return res.status(401).json({ error: "Invalid or expired code" });
    const payload = result.payload || {};

    const user = await createUser({ name: payload.name, email, password: payload.password });
    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ user, token });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Registration verification failed" });
  }
}

// Step 1: verify credentials and send OTP to email
export async function requestOtp(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await verifyCredentials({ email, password });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    await createAndSendOtp({ email, purpose: "login" });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Could not send OTP" });
  }
}

// Step 2: verify OTP and issue JWT
export async function verifyOtpAndIssueToken(req, res) {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ error: "Email and code required" });
    const result = await verifyAndConsumeOtp({ email, code, purpose: "login" });
    if (!result.ok) return res.status(401).json({ error: "Invalid or expired code" });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ user: { name: user.name, email: user.email }, token });
  } catch (err) {
    return res.status(500).json({ error: err.message || "OTP verify failed" });
  }
}

export async function logout(req, res) {
  // Stateless JWT logout would require token blacklisting; for now just return ok
  return res.json({ ok: true });
}
