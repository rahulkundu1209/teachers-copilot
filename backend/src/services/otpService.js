import nodemailer from "nodemailer";
import Otp from "../models/Otp.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function createAndSendOtp({ email, purpose, payload = {} }) {
  if (!email) throw new Error("Email required for OTP");
  if (!purpose) throw new Error("Purpose required for OTP");

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Upsert-like: remove existing OTPs for this email/purpose, then insert new
  await Otp.deleteMany({ email: email.toLowerCase(), purpose });
  await Otp.create({ email: email.toLowerCase(), code, purpose, expiresAt, payload });

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || (process.env.SMTP_USER || "no-reply@example.com");
  const text = `Your verification code is: ${code} (valid 5 minutes)`;

  if (!transporter) {
    console.log(`[OTP] SMTP not configured; code for ${email} is ${code}`);
    return { ok: true, debug: true };
  }

  await transporter.sendMail({ from, to: email, subject: "Your verification code", text });
  return { ok: true };
}

export async function verifyAndConsumeOtp({ email, code, purpose }) {
  const rec = await Otp.findOne({ email: (email || "").toLowerCase(), purpose });
  if (!rec) return { ok: false, reason: "not_found" };
  if (rec.code !== String(code)) return { ok: false, reason: "code_mismatch" };
  if (Date.now() > new Date(rec.expiresAt).getTime()) {
    await Otp.deleteOne({ _id: rec._id });
    return { ok: false, reason: "expired" };
  }
  const payload = rec.payload || {};
  await Otp.deleteOne({ _id: rec._id });
  return { ok: true, payload };
}
