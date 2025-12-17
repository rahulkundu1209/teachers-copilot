// pages/register.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Head from "next/head";

export default function Register() {
  const router = useRouter();
  const { user, initialized, setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("form"); // form -> otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect authenticated users to dashboard
  // Redirect signed-in users away unless they are in the OTP step of registration
  useEffect(() => {
    if (initialized && user && step !== "otp") {
      router.replace("/dashboard");
    }
  }, [user, initialized, router, step]);

  async function handleRequestOtp(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    
    // Frontend validation
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not send OTP");
      setStep("otp");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    try {
      const res = await fetch(`${API_BASE}/api/auth/register/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Invalid code");

      const user = data.user;
      const token = data.token;
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("tc_user", JSON.stringify(user));
          localStorage.setItem("tc_token", token);
        }
      } catch (err) {
        console.warn("Could not save auth locally", err);
      }
      if (typeof setUser === "function") setUser(user);
      router.push("/create-profile?from=register");
    } catch (err) {
      console.error(err);
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
      <Head>
        <title>Signup - Teacher's Copilot</title>
      </Head>
      <div
        className="w-full max-w-4xl rounded-2xl shadow-xl py-16 px-10"
        style={{ background: "rgba(217,217,217,0.38)" }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#0A1A2F] mb-10">
          Register
        </h2>

        <div className="space-y-6">
          {step === "form" && (
            <>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full h-14 rounded-lg px-4 text-lg"
                style={{ backgroundColor: "#909DAE", color: "#0B1220", border: "none" }}
                autoComplete="name"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-14 rounded-lg px-4 text-lg"
                style={{ backgroundColor: "#909DAE", color: "#0B1220", border: "none" }}
                autoComplete="email"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-14 rounded-lg px-4 text-lg"
                style={{ backgroundColor: "#909DAE", color: "#0B1220", border: "none" }}
                autoComplete="new-password"
              />

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition"
                >
                  {loading ? "Sending..." : "Register & Send OTP"}
                </button>
              </div>
            </>
          )}

          {step === "otp" && (
            <>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full h-14 rounded-lg px-4 text-lg"
                style={{ backgroundColor: "#909DAE", color: "#0B1220", border: "none" }}
              />
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Edit info
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-lg mt-8 text-[#0B1220]">
          Already Registered?{" "}
          <Link href="/" className="text-blue-600 font-semibold">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
