// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const AuthContext = createContext();

// a small exported helper so modules that call logout() directly still work
// (keeps compatibility with any file that does `import { logout } from "../context/AuthContext"`)
export function logout() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tc_user");
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
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("tc_user") : null;
      if (raw) {
        setUserState(JSON.parse(raw));
      }
    } catch (err) {
      console.warn("AuthContext: could not read tc_user from localStorage", err);
    } finally {
      setInitialized(true);
    }
  }, []);

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
