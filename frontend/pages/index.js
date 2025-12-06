// pages/index.js (Login)
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    // temporary flexible login: accept any values
    const mockUser = { name: "hello", email };
    try {
      if (typeof window !== "undefined") localStorage.setItem("tc_user", JSON.stringify(mockUser));
    } catch (err) {
      console.warn("Could not save mock user to localStorage", err);
    }

    // update context immediately so other pages don't redirect
    if (typeof setUser === "function") setUser(mockUser);

    router.push("/dashboard");
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

        <div className="space-y-6">
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLogin}
              className="bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition"
            >
              Log In
            </button>
          </div>
        </div>

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
