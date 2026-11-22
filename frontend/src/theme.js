import { useState } from "react";

// Light or dark. index.html sets the first value before React loads (the saved choice,
// or the system setting), so the page never flashes the wrong colours.
const KEY = "trellis-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
    setTheme(next);
  }

  return [theme, toggleTheme];
}
