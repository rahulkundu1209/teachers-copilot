// pages/register.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleRegister(e) {
    if (e && e.preventDefault) e.preventDefault();

    const mockUser = { name: fullName || "hello", email };
    try {
      if (typeof window !== "undefined") localStorage.setItem("tc_user", JSON.stringify(mockUser));
    } catch (err) {
      console.warn("Could not save mock user to localStorage", err);
    }

    if (typeof setUser === "function") setUser(mockUser);

    // go to onboarding with a query param so onboarding allows access
    router.push("/create-profile?from=register");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
      <div
        className="w-full max-w-4xl rounded-2xl shadow-xl py-16 px-10"
        style={{ background: "rgba(217,217,217,0.38)" }}
      >
        <h2 className="text-center text-3xl font-semibold text-[#0A1A2F] mb-10">
          Register
        </h2>

        <div className="space-y-6">
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRegister}
              className="bg-[#0077B6] hover:bg-[#00639b] text-white px-8 py-3 rounded-lg text-lg transition"
            >
              Register
            </button>
          </div>
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
