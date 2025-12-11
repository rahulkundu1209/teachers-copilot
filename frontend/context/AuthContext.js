// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

// a small exported helper so modules that call logout() directly still work
// (keeps compatibility with any file that does `import { logout } from "../context/AuthContext"}`)
export function logout() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tc_user");
      localStorage.removeItem("tc_token");
    }
  } catch (e) {
    console.warn("logout: could not clear localStorage", e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // read user from localStorage on mount (client-only)
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const rawUser = typeof window !== "undefined" ? localStorage.getItem("tc_user") : null;
        const rawToken = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (!cancelled) setUserState(parsed);
        }

        // Validate token & user existence with backend
        if (rawToken) {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const res = await fetch(`${API_BASE}/api/user/profile`, {
            headers: { Authorization: `Bearer ${rawToken}` },
          });
          if (!res.ok) {
            // Token invalid or user missing -> clear auth
            if (!cancelled) {
              localStorage.removeItem("tc_user");
              localStorage.removeItem("tc_token");
              setUserState(null);
            }
          } else {
            const data = await res.json().catch(() => null);
            if (data?.user && !cancelled) {
              setUserState((prev) => ({ ...(prev || {}), ...data.user }));
              localStorage.setItem("tc_user", JSON.stringify({ ...(data.user || {}) }));
            }
          }
        }
      } catch (err) {
        console.warn("AuthContext: bootstrap failed", err);
        if (!cancelled) {
          localStorage.removeItem("tc_user");
          localStorage.removeItem("tc_token");
          setUserState(null);
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep users logged in - no auto-logout on refresh/close
  // Manual logout via Sign Out button clears tokens


  // centralised save -> updates state + localStorage
  const setUser = useCallback((u) => {
    try {
      if (typeof window !== "undefined") {
        if (u === null || typeof u === "undefined") {
          localStorage.removeItem("tc_user");
        } else {
          localStorage.setItem("tc_user", JSON.stringify(u));
        }
      }
    } catch (e) {
      console.warn("AuthContext: setUser localStorage failed", e);
    }
    setUserState(u);
  }, []);

  // updateProfile merges patch into user.profile, persists it
  const updateProfile = useCallback((patch = {}, done = false) => {
    setUserState((prev) => {
      const next = {
        ...(prev || {}),
        profile: {
          ...(prev?.profile || {}),
          ...patch,
        },
      };
      try {
        if (typeof window !== "undefined") localStorage.setItem("tc_user", JSON.stringify(next));
      } catch (e) {
        console.warn("AuthContext: updateProfile localStorage failed", e);
      }
      return next;
    });
    // `done` is available to the caller (not used here)
  }, []);

  // logout function available in context (recommended method)
  const logoutInContext = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("tc_user");
        localStorage.removeItem("tc_token");
      }
    } catch (e) {
      console.warn("AuthContext: logout localStorage failed", e);
    }
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initialized, setUser, updateProfile, logout: logoutInContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
