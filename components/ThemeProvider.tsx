"use client";

/**
 * ThemeProvider — nuclear-reliable dark mode
 *
 * Instead of manipulating document.documentElement.classList (which can race
 * with React hydration), we render a React-controlled wrapper div that carries
 * the "dark" class. Because React owns this element, the class is always in
 * sync with state. Tailwind's `dark:` variants work via the selector
 * `.dark .dark\:xxx` — any ancestor with the `dark` class satisfies it.
 *
 * `display: contents` makes the div invisible to layout so it never causes
 * double scrollbars, height issues, or flex-child problems.
 */

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeCtxValue {
  theme:  Theme;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // light is the default

  // On mount: read saved preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") setTheme("dark");
      // If nothing saved, stay on light (the default)
    } catch { /* ignore SSR / private-browsing errors */ }
  }, []);

  // Persist + sync <html> class for globals.css body-background rules
  useEffect(() => {
    try { localStorage.setItem("theme", theme); } catch {}
    // Keep html class in sync so globals.css `html.dark body` rule fires
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {/*
        This div carries the "dark" class that Tailwind's dark: variants
        match against. display:contents makes it layout-transparent.
      */}
      <div className={theme === "dark" ? "dark" : undefined} style={{ display: "contents" }}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
