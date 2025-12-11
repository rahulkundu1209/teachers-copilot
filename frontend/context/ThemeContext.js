import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load theme from localStorage on mount
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("tc_theme") : null;
      if (saved) {
        setTheme(saved);
        applyTheme(saved);
      }
    } catch (err) {
      console.warn("Could not load theme from localStorage", err);
    }
    setInitialized(true);
  }, []);

  function applyTheme(themeName) {
    if (typeof document === "undefined") return;
    if (themeName === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function setThemeValue(themeName) {
    setTheme(themeName);
    applyTheme(themeName);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("tc_theme", themeName);
      }
    } catch (err) {
      console.warn("Could not save theme to localStorage", err);
    }
  }

  const value = { theme, setTheme: setThemeValue, initialized };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
