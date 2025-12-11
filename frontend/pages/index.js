// pages/index.js (Login)
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("credentials"); // 'credentials' or 'otp'
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (initialized && user) {
      router.replace("/dashboard");
    }
  }, [user, initialized, router]);
  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;
    
    // Frontend validation
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
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("You are not registered. Please register first.");
        }
        throw new Error(data?.error || "Could not request OTP");
      }
      // proceed to OTP step
      setStep("otp");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not request OTP");
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
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
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
        console.warn("Could not save auth to localStorage", err);
      }
      if (typeof setUser === "function") setUser(user);
      router.push("/dashboard");
      return;
    } catch (err) {
      console.error(err);
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
      <div
        className="w-full max-w-4xl rounded-2xl shadow-xl py-16 px-10"
        style={{ background: "rgba(217,217,217,0.38)" }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#0A1A2F] mb-10">
          Log In
        </h2>

        {step === "credentials" ? (
          <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-14 rounded-lg px-4 text-lg"
            style={{
              backgroundColor: "#909DAE",
              color: "#0B1220",
              border: "none",
            }}
            autoComplete="email"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full h-14 rounded-lg px-4 text-lg"
            style={{
              backgroundColor: "#909DAE",
              color: "#0B1220",
              border: "none",
            }}
            autoComplete="current-password"
          />

            {error && <div className="text-red-600">{error}</div>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-sm text-gray-700">An OTP was sent to <strong>{email}</strong>. Enter it below.</p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full h-14 rounded-lg px-4 text-lg"
              style={{ backgroundColor: "#909DAE", color: "#0B1220", border: "none" }}
            />
            {error && <div className="text-red-600">{error}</div>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-lg mt-8 text-[#0B1220]">
          New User?{" "}
          <Link href="/register" className="text-blue-600 font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
